import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma, saveAssessment, syncUser } from '@reelworx/shared/server';
import { type AssessmentResponses } from '@reelworx/shared';
import { NextResponse } from 'next/server';

// The MOBILE candidate app submits Full Spectrum Assessment responses here (Feature 1.5).
// Scoring + merge + profile-strength recompute all live in shared/server so the meter the
// candidate sees is the meter we store.
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { responses?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const responses = normalizeResponses(body.responses);
  if (!responses) {
    return NextResponse.json({ error: 'responses required' }, { status: 400 });
  }

  const cu = await currentUser();
  const email =
    cu?.primaryEmailAddress?.emailAddress ??
    cu?.emailAddresses[0]?.emailAddress ??
    `${userId}@placeholder.local`;

  try {
    const user = await syncUser(prisma, { authId: userId, email, role: 'candidate' });
    const result = await saveAssessment(prisma, { userId: user.id, responses });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: 'Assessment service unavailable', detail: String(err) },
      { status: 503 },
    );
  }
}

// Accept only { [itemId]: 1..5 } — drop anything malformed rather than scoring garbage.
function normalizeResponses(raw: unknown): AssessmentResponses | null {
  if (!raw || typeof raw !== 'object') return null;
  const out: AssessmentResponses = {};
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === 'number' && value >= 1 && value <= 5 && Number.isInteger(value)) {
      out[id] = value as AssessmentResponses[string];
    }
  }
  return Object.keys(out).length > 0 ? out : null;
}
