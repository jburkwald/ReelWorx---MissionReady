import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma, syncUser } from '@reelworx/shared/server';
import { NextResponse } from 'next/server';

// Provisioning + identity endpoint. The MOBILE app calls this on launch (Clerk session
// token as a Bearer header) to create/fetch its candidate User + Profile. The web app
// provisions server-side instead (see lib/db-user.ts).
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
    return NextResponse.json({ user });
  } catch (err) {
    // Most likely DATABASE_URL is not configured yet.
    return NextResponse.json(
      { error: 'Database unavailable', detail: String(err) },
      { status: 503 },
    );
  }
}
