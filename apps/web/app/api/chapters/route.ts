import { auth, currentUser } from '@clerk/nextjs/server';
import { addLivingChapter, listLivingChapters, prisma, syncUser } from '@reelworx/shared/server';
import { NextResponse } from 'next/server';

// The Living Profile (Feature 1.6) — the MOBILE app lists and adds chapters. Append-only.
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
    const id = await candidateId();
    if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ chapters: await listLivingChapters(prisma, id) });
  } catch (err) {
    return NextResponse.json({ error: 'Chapters unavailable', detail: String(err) }, { status: 503 });
  }
}

export async function POST(req: Request) {
  let body: { title?: string; body?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  try {
    const id = await candidateId();
    if (!id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const chapters = await addLivingChapter(prisma, {
      userId: id,
      title: body.title ?? '',
      body: body.body ?? '',
    });
    return NextResponse.json({ chapters });
  } catch (err) {
    return NextResponse.json({ error: 'Chapters unavailable', detail: String(err) }, { status: 503 });
  }
}
