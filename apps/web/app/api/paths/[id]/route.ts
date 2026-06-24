import { auth, currentUser } from '@clerk/nextjs/server';
import { getOrCreatePathDetail, prisma, syncUser } from '@reelworx/shared/server';
import { NextResponse } from 'next/server';

// Resource Hub + Gaps & the Bridge (Features 2.3/2.4) — the MOBILE candidate app opens a
// path to see what it involves and what they'd need to close. Generated on demand, cached.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const cu = await currentUser();
  const email =
    cu?.primaryEmailAddress?.emailAddress ??
    cu?.emailAddresses[0]?.emailAddress ??
    `${userId}@placeholder.local`;

  try {
    const user = await syncUser(prisma, { authId: userId, email, role: 'candidate' });
    const detail = await getOrCreatePathDetail(prisma, { userId: user.id, pathId: id });
    if (!detail) return NextResponse.json({ error: 'Path not found' }, { status: 404 });
    return NextResponse.json({ detail });
  } catch (err) {
    return NextResponse.json({ error: 'Path detail unavailable', detail: String(err) }, { status: 503 });
  }
}
