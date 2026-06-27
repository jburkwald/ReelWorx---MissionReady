import { parseResume } from '@reelworx/shared/server';
import { NextResponse } from 'next/server';

// GUEST resume fast-track — no auth, no DB. Parses a pasted resume to pre-fill Phase 1
// (the record). With ANTHROPIC_API_KEY it's the real parse; without it, parseResume
// returns a canned sample so the upload path walks with no AI key.
export async function POST(req: Request) {
  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { parsed, demo } = await parseResume(body.text ?? '');
  return NextResponse.json({ parsed, demo: Boolean(demo) });
}
