import { auth, currentUser } from '@clerk/nextjs/server';
import { saveVeteranRecord, prisma, syncUser } from '@reelworx/shared/server';
import type { VeteranRecord } from '@reelworx/shared';
import { NextResponse } from 'next/server';

// Persist the Veteran Door record (Feature 1.1) for the signed-in candidate. The structured
// record is captured by tap-and-select on the client; here it lands on the Profile + Roots.
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { record?: VeteranRecord };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.record) return NextResponse.json({ error: 'record required' }, { status: 400 });

  const cu = await currentUser();
  const email =
    cu?.primaryEmailAddress?.emailAddress ??
    cu?.emailAddresses[0]?.emailAddress ??
    `${userId}@placeholder.local`;

  try {
    const user = await syncUser(prisma, { authId: userId, email, role: 'candidate' });
    const result = await saveVeteranRecord(prisma, { userId: user.id, record: body.record });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: 'Record save unavailable', detail: String(err) }, { status: 503 });
  }
}
