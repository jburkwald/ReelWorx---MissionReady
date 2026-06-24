import { auth, currentUser } from '@clerk/nextjs/server';
import {
  createIntroVideoUpload,
  prisma,
  saveIntroVideo,
  syncUser,
} from '@reelworx/shared/server';
import { NextResponse } from 'next/server';

// The MOBILE candidate app drives the Intro Video (Feature 1.4) in two POSTs:
//   { step: 'create' }              → returns a Mux direct-upload target to PUT bytes to
//   { step: 'complete', uploadId }  → pins the resulting asset to the Profile, returns
//                                      the new profile strength (the earned jump)
// Large video bytes never pass through this server — only the upload handshake does.
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { step?: string; uploadId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const cu = await currentUser();
  const email =
    cu?.primaryEmailAddress?.emailAddress ??
    cu?.emailAddresses[0]?.emailAddress ??
    `${userId}@placeholder.local`;

  try {
    const user = await syncUser(prisma, { authId: userId, email, role: 'candidate' });

    if (body.step === 'create') {
      const origin = req.headers.get('origin') ?? undefined;
      const upload = await createIntroVideoUpload(origin);
      return NextResponse.json({ uploadId: upload.uploadId, uploadUrl: upload.uploadUrl });
    }

    if (body.step === 'complete') {
      if (!body.uploadId) {
        return NextResponse.json({ error: 'uploadId required' }, { status: 400 });
      }
      const result = await saveIntroVideo(prisma, { userId: user.id, uploadId: body.uploadId });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Unknown step' }, { status: 400 });
  } catch (err) {
    // Most likely MUX_TOKEN_ID/SECRET or DATABASE_URL not configured yet.
    return NextResponse.json(
      { error: 'Video service unavailable', detail: String(err) },
      { status: 503 },
    );
  }
}
