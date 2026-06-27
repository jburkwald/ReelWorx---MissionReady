import { synthesizeSpeech, type SynthesizeOptions } from '@reelworx/shared/server';
import { NextResponse } from 'next/server';

// Premium text-to-speech: speaks the agent's reply in the configured ElevenLabs voice.
// Returns audio/mpeg. 501 when no key is set, so the client falls back to browser TTS.
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: { text?: string } & SynthesizeOptions;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.text?.trim()) {
    return NextResponse.json({ error: 'text required' }, { status: 400 });
  }

  try {
    const result = await synthesizeSpeech(body.text, body);
    if (!result) {
      // No premium key — tell the client to use the browser voice.
      return NextResponse.json({ provider: null }, { status: 501 });
    }
    return new Response(result.audio, {
      status: 200,
      headers: { 'Content-Type': result.contentType, 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    return NextResponse.json({ error: 'TTS failed', detail: String(err) }, { status: 502 });
  }
}
