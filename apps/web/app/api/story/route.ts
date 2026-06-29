import { auth, currentUser } from '@clerk/nextjs/server';
import {
  EVENT_TYPES,
  logEvent,
  Prisma,
  prisma,
  profileStrengthScoreForProfile,
  runStoryTurn,
  syncUser,
} from '@reelworx/shared/server';
import {
  VOICE_AGENT,
  recordPhaseComplete,
  storyPhaseComplete,
  type ProfileExtraction,
  type StoryMessage,
  type StoryPhaseId,
} from '@reelworx/shared';
import { NextResponse } from 'next/server';

// Loose view of the Full Spectrum JSON we persist incrementally as the story unfolds.
interface FitJson {
  skillsExperience?: { translatedSkills?: string[]; civilianEquivalents?: string[] };
  motivationValues?: { coreValues?: string[]; whatDrivesThem?: string };
  [k: string]: unknown;
}
interface WhyMove {
  role: string;
  why: string;
}

const uniq = (xs: string[]) => Array.from(new Set(xs.map((s) => s.trim()).filter(Boolean)));

// The MOBILE candidate app calls this each conversational turn. It runs one agent
// turn, merges anything the agent extracted into the Profile, recomputes strength
// with the shared (honest, deterministic) function, and returns the reply + score.
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { messages?: StoryMessage[]; voice?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages required' }, { status: 400 });
  }

  const cu = await currentUser();
  const email =
    cu?.primaryEmailAddress?.emailAddress ??
    cu?.emailAddresses[0]?.emailAddress ??
    `${userId}@placeholder.local`;

  try {
    const user = await syncUser(prisma, { authId: userId, email, role: 'candidate' });
    const profile = user.profile;
    if (!profile) {
      return NextResponse.json({ error: 'No candidate profile' }, { status: 409 });
    }

    const { reply, extraction } = await runStoryTurn(
      messages,
      body.voice ? { systemAddendum: VOICE_AGENT.spokenStyleAddendum } : undefined,
    );
    const merged = mergeIntoProfile(profile.fitProfile, profile.whyEachMove, extraction);

    // Strength from the merged profile via the shared registry — the same number the
    // candidate sees on web and mobile. Foundation completes once the record + story
    // signals are present; the assessment block (if any) is preserved inside `merged`.
    const completeness = profileStrengthScoreForProfile({
      headline: extraction?.headline ?? profile.headline,
      fitProfile: merged.fitProfile,
      whyEachMove: merged.whyEachMove,
      videoIntroUrl: profile.videoIntroUrl,
      videoIntroAssetId: profile.videoIntroAssetId,
    });

    // Hometown is a single value; Open To is an additive list (union with what's there).
    const existingOpenTo = Array.isArray(profile.openTo) ? (profile.openTo as string[]) : [];
    const mergedOpenTo = extraction?.openTo?.length
      ? Array.from(new Set([...existingOpenTo, ...extraction.openTo]))
      : undefined;

    await prisma.profile.update({
      where: { id: profile.id },
      data: {
        ...(extraction?.headline ? { headline: extraction.headline } : {}),
        ...(extraction?.hometown ? { hometown: extraction.hometown } : {}),
        ...(mergedOpenTo ? { openTo: mergedOpenTo as Prisma.InputJsonValue } : {}),
        fitProfile: merged.fitProfile as Prisma.InputJsonValue,
        whyEachMove: merged.whyEachMove as unknown as Prisma.InputJsonValue,
        completenessScore: completeness,
      },
    });

    // Mirror Hometown to the search-indexed User.hometown so "Come Home" sourcing finds them.
    if (extraction?.hometown) {
      await prisma.user.update({
        where: { id: user.id },
        data: { hometown: extraction.hometown },
      });
    }

    await logEvent(prisma, {
      actorId: user.id,
      eventType: 'story_turn',
      targetId: profile.id,
      metadata: { saved: Boolean(extraction), completeness },
    });

    // Which foundation phase the candidate is in, so the app can show "Phase X of 3".
    const fitVals = (merged.fitProfile.motivationValues ?? {}) as { whatDrivesThem?: string };
    const signals = {
      headline: extraction?.headline ?? profile.headline,
      skillsCount: merged.skills.length,
      whyEachMoveCount: merged.whyEachMove.length,
      valuesCount: merged.values.length,
      hasWhatDrives: Boolean(fitVals.whatDrivesThem),
    };
    const recordDone = recordPhaseComplete(signals);
    const storyDone = storyPhaseComplete(signals);
    const phase: StoryPhaseId = !recordDone ? 'record' : !storyDone ? 'story' : 'boosts';

    return NextResponse.json({ reply, completeness, phase, foundationComplete: recordDone && storyDone });
  } catch (err) {
    // Most likely ANTHROPIC_API_KEY or DATABASE_URL not configured yet.
    return NextResponse.json(
      { error: 'Story service unavailable', detail: String(err) },
      { status: 503 },
    );
  }
}

function mergeIntoProfile(
  fitProfileJson: unknown,
  whyEachMoveJson: unknown,
  extraction: ProfileExtraction | undefined,
) {
  const fit = (fitProfileJson ?? {}) as FitJson;
  const existingSkills = [
    ...(fit.skillsExperience?.translatedSkills ?? []),
    ...(extraction?.skills ?? []),
  ];
  const existingCivilian = [
    ...(fit.skillsExperience?.civilianEquivalents ?? []),
    ...(extraction?.civilianEquivalents ?? []),
  ];
  const existingValues = [
    ...(fit.motivationValues?.coreValues ?? []),
    ...(extraction?.coreValues ?? []),
  ];

  const skills = uniq(existingSkills);
  const civilian = uniq(existingCivilian);
  const values = uniq(existingValues);

  const fitProfile: FitJson = {
    ...fit,
    skillsExperience: { translatedSkills: skills, civilianEquivalents: civilian },
    motivationValues: {
      coreValues: values,
      ...(extraction?.whatDrivesThem
        ? { whatDrivesThem: extraction.whatDrivesThem }
        : fit.motivationValues?.whatDrivesThem
          ? { whatDrivesThem: fit.motivationValues.whatDrivesThem }
          : {}),
    },
  };

  // Merge whyEachMove by role (new entries win).
  const byRole = new Map<string, string>();
  for (const w of (whyEachMoveJson ?? []) as WhyMove[]) byRole.set(w.role, w.why);
  for (const w of extraction?.whyEachMove ?? []) byRole.set(w.role, w.why);
  const whyEachMove: WhyMove[] = Array.from(byRole, ([role, why]) => ({ role, why }));

  return { fitProfile, skills, values, whyEachMove };
}
