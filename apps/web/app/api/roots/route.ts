import { auth, currentUser } from '@clerk/nextjs/server';
import {
  listRoots,
  prisma,
  setRoots,
  syncUser,
  type RootInput,
} from '@reelworx/shared/server';
import { NextResponse } from 'next/server';

// The MOBILE candidate app reads + edits their Roots (Feature 3.3) — the places they have
// ties to, with one primary hometown. This is what makes "come home" search find them.
//   GET                  → current roots
//   POST { roots: [...] } → replace the whole set (one primary enforced server-side)
async function candidateId(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const cu = await currentUser();
  const email =
    cu?.primaryEmailAddress?.emailAddress ??
    cu?.emailAddresses[0]?.emailAddress ??
    `${userId}@placeholder.local`;
  const user = await syncUser(prisma, { authId: userId, email, role: 'candidate' });
  return user.id;
}

export async function GET() {
  try {
    const uid = await candidateId();
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ roots: await listRoots(prisma, uid) });
  } catch (err) {
    return NextResponse.json({ error: 'Roots unavailable', detail: String(err) }, { status: 503 });
  }
}

export async function POST(req: Request) {
  let body: { roots?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!Array.isArray(body.roots)) {
    return NextResponse.json({ error: 'roots array required' }, { status: 400 });
  }

  // Accept only well-formed entries; setRoots normalizes + enforces a single primary.
  const roots: RootInput[] = body.roots
    .filter((r): r is { place: string; isPrimary?: boolean; reason?: string } =>
      Boolean(r) && typeof (r as { place?: unknown }).place === 'string',
    )
    .map((r) => ({ place: r.place, isPrimary: Boolean(r.isPrimary), reason: r.reason ?? null }));

  try {
    const uid = await candidateId();
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ roots: await setRoots(prisma, { userId: uid, roots }) });
  } catch (err) {
    return NextResponse.json({ error: 'Roots service unavailable', detail: String(err) }, { status: 503 });
  }
}
