import { auth, currentUser } from '@clerk/nextjs/server';
import {
  prisma,
  runAssessmentTurn,
  saveAssessmentRead,
  syncUser,
} from '@reelworx/shared/server';
import { VOICE_AGENT, type StoryMessage } from '@reelworx/shared';
import { NextResponse } from 'next/server';

// The conversational Full Spectrum assessment (Personality / EQ / Resilience & Drive).
// The MOBILE app (and signed-in web) calls this each turn. The agent's running numeric
// read merges into Profile.fitProfile as it firms up; on complete it also lands the two
// narratives (candidate reflection + the employer-facing Insight) and strength recomputes.
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

    const { reply, read } = await runAssessmentTurn(
      messages,
      body.voice ? { systemAddendum: VOICE_AGENT.spokenStyleAddendum } : undefined,
    );

    let completeness: number | undefined;
    if (read) {
      const saved = await saveAssessmentRead(prisma, { userId: user.id, read });
      completeness = saved.completeness;
    }

    return NextResponse.json({
      reply,
      complete: Boolean(read?.complete),
      reflection: read?.complete ? read.candidateReflection ?? null : null,
      completeness,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Assessment service unavailable', detail: String(err) },
      { status: 503 },
    );
  }
}
