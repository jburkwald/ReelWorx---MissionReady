import { auth, currentUser } from '@clerk/nextjs/server';
import { listInvitesForCandidate, prisma, syncUser } from '@reelworx/shared/server';
import { NextResponse } from 'next/server';

// The MOBILE candidate app reads who has reached out to them (Feature 3.2). Being pursued
// is the emotional moment for a transitioning member — this is the data behind it.
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
    const invites = await listInvitesForCandidate(prisma, user.id);
    return NextResponse.json({ invites });
  } catch (err) {
    return NextResponse.json({ error: 'Invites unavailable', detail: String(err) }, { status: 503 });
  }
}
