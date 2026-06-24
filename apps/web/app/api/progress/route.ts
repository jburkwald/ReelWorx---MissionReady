import { auth, currentUser } from '@clerk/nextjs/server';
import { getCandidateDashboard, prisma, syncUser } from '@reelworx/shared/server';
import { NextResponse } from 'next/server';

// The Veteran's Own View (Feature 6.2) — the MOBILE candidate app reads their momentum:
// profile strength, who's interested, where they are on a path. Real state only.
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cu = await currentUser();
  const email =
    cu?.primaryEmailAddress?.emailAddress ??
    cu?.emailAddresses[0]?.emailAddress ??
    `${userId}@placeholder.local`;

  try {
    const user = await syncUser(prisma, { authId: userId, email, role: 'candidate' });
    const dashboard = await getCandidateDashboard(prisma, user.id);
    return NextResponse.json(dashboard);
  } catch (err) {
    return NextResponse.json({ error: 'Progress unavailable', detail: String(err) }, { status: 503 });
  }
}
