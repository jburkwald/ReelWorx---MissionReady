import { auth, currentUser } from '@clerk/nextjs/server';
import {
  createShareLink,
  ensureAdvocateForUser,
  getAdvocateImpact,
  prisma,
  syncUser,
} from '@reelworx/shared/server';
import { NextResponse } from 'next/server';

// Serve Forward (Features 4.1/4.2) — the MOBILE candidate app.
//   GET  → the veteran's impact (shares minted, visits driven)
//   POST → mint a new trackable share link; returns the full URL to hand to the OS share sheet
async function candidate() {
  const { userId } = await auth();
  if (!userId) return null;
  const cu = await currentUser();
  const email =
    cu?.primaryEmailAddress?.emailAddress ??
    cu?.emailAddresses[0]?.emailAddress ??
    `${userId}@placeholder.local`;
  return syncUser(prisma, { authId: userId, email, role: 'candidate' });
}

export async function GET() {
  try {
    const user = await candidate();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json(await getAdvocateImpact(prisma, user.id));
  } catch (err) {
    return NextResponse.json({ error: 'Unavailable', detail: String(err) }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await candidate();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const advocate = await ensureAdvocateForUser(prisma, { userId: user.id, email: user.email });
    const { shortUrl } = await createShareLink(prisma, {
      advocateId: advocate.id,
      tracking: { kind: 'serve_forward' },
    });

    const origin = req.headers.get('origin') ?? new URL(req.url).origin;
    return NextResponse.json({ shareUrl: `${origin}/s/${shortUrl}`, shortUrl });
  } catch (err) {
    return NextResponse.json({ error: 'Unavailable', detail: String(err) }, { status: 503 });
  }
}
