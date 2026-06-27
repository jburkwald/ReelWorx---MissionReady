import { auth, currentUser } from '@clerk/nextjs/server';
import {
  parseResume,
  Prisma,
  prisma,
  profileStrengthScoreForProfile,
  syncUser,
} from '@reelworx/shared/server';
import { NextResponse } from 'next/server';

// Resume fast-track (Feature 1.2 upload mode) — the MOBILE app posts a resume; we parse it,
// pre-fill the candidate's record (headline + skills), and return the parsed record for the
// confirm-and-correct step. The why still gets drawn out in conversation (Phase 2).
const uniq = (xs: string[]) => Array.from(new Set(xs.map((s) => s.trim()).filter(Boolean)));

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const cu = await currentUser();
  const email =
    cu?.primaryEmailAddress?.emailAddress ??
    cu?.emailAddresses[0]?.emailAddress ??
    `${userId}@placeholder.local`;

  try {
    const user = await syncUser(prisma, { authId: userId, email, role: 'candidate' });
    const profile = user.profile;
    if (!profile) return NextResponse.json({ error: 'No candidate profile' }, { status: 409 });

    const { parsed, demo } = await parseResume(body.text ?? '');

    const fit = (profile.fitProfile ?? {}) as {
      skillsExperience?: { translatedSkills?: string[]; civilianEquivalents?: string[] };
    };
    const skills = uniq([...(fit.skillsExperience?.translatedSkills ?? []), ...parsed.skills]);
    const civilian = uniq([
      ...(fit.skillsExperience?.civilianEquivalents ?? []),
      ...parsed.civilianEquivalents,
    ]);
    const merged = {
      ...fit,
      skillsExperience: { translatedSkills: skills, civilianEquivalents: civilian },
    };
    const headline = parsed.headline ?? profile.headline;

    const completeness = profileStrengthScoreForProfile({
      headline,
      fitProfile: merged,
      whyEachMove: profile.whyEachMove,
      videoIntroUrl: profile.videoIntroUrl,
      videoIntroAssetId: profile.videoIntroAssetId,
    });

    await prisma.profile.update({
      where: { id: profile.id },
      data: {
        headline,
        fitProfile: merged as unknown as Prisma.InputJsonValue,
        completenessScore: completeness,
      },
    });

    return NextResponse.json({ parsed, completeness, demo: Boolean(demo) });
  } catch (err) {
    return NextResponse.json({ error: 'Resume service unavailable', detail: String(err) }, { status: 503 });
  }
}
