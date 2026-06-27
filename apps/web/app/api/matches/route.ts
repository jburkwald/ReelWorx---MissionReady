import { auth, currentUser } from '@clerk/nextjs/server';
import { getCandidateFitReads, prisma, syncUser } from '@reelworx/shared/server';
import { NextResponse } from 'next/server';

// Candidate-side Fit Read (Feature 2.2) — the MOBILE app reads the companies that suit them,
// each with a plain reason. Real state only; demo data when no DB is configured.
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cu = await currentUser();
  const email =
    cu?.primaryEmailAddress?.emailAddress ??
    cu?.emailAddresses[0]?.emailAddress ??
    `${userId}@placeholder.local`;

  try {
    const user = await syncUser(prisma, { authId: userId, email, role: 'candidate' });
    const reads = await getCandidateFitReads(prisma, user.id);
    return NextResponse.json({ reads });
  } catch (err) {
    return NextResponse.json({ error: 'Fit Read unavailable', detail: String(err) }, { status: 503 });
  }
}
