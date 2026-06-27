import { auth, currentUser } from '@clerk/nextjs/server';
import { applyToRole, prisma, syncUser } from '@reelworx/shared/server';
import { NextResponse } from 'next/server';

// Candidate intentful reach (Feature 3.2): spend an application token to reach out on a role.
// Authed candidate only. Demo data when no DB.
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { roleId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.roleId) return NextResponse.json({ error: 'roleId required' }, { status: 400 });

  const cu = await currentUser();
  const email =
    cu?.primaryEmailAddress?.emailAddress ??
    cu?.emailAddresses[0]?.emailAddress ??
    `${userId}@placeholder.local`;

  try {
    const user = await syncUser(prisma, { authId: userId, email, role: 'candidate' });
    const result = await applyToRole(prisma, { userId: user.id, roleId: body.roleId });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: 'Reach-out unavailable', detail: String(err) }, { status: 503 });
  }
}
