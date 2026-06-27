import { synthesizeSpeech, type SynthesizeOptions } from '@reelworx/shared/server';
import { NextResponse } from 'next/server';

// Premium text-to-speech: speaks the agent's reply in the configured ElevenLabs voice.
// Returns audio/mpeg. 501 when no key is set, so the client falls back to browser TTS.
export const dynamic = 'force-dynamic';

async function synth(text: string, opts: SynthesizeOptions) {
  const result = await synthesizeSpeech(text, opts);
  if (!result) {
    // No premium key — tell the client to use the device's built-in voice.
    return NextResponse.json({ provider: null }, { status: 501 });
  }
  return new Response(result.audio, {
    status: 200,
    headers: { 'Content-Type': result.contentType, 'Cache-Control': 'no-store' },
  });
}

// POST (web): JSON body. Returns audio/mpeg, or 501 to fall back to the browser voice.
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
    return await synth(body.text, body);
  } catch (err) {
    return NextResponse.json({ error: 'TTS failed', detail: String(err) }, { status: 502 });
  }
}

// GET (mobile): query params, so the native audio player can stream the HD voice by URL.
//   /api/voice/tts?text=...&speed=1.0&voiceId=...
export async function GET(req: Request) {
  const url = new URL(req.url);
  const text = url.searchParams.get('text');
  if (!text?.trim()) {
    return NextResponse.json({ error: 'text required' }, { status: 400 });
  }
  const speed = url.searchParams.get('speed');
  const voiceId = url.searchParams.get('voiceId');
  try {
    return await synth(text, {
      ...(speed ? { speed: Number(speed) } : {}),
      ...(voiceId ? { voiceId } : {}),
    });
  } catch (err) {
    return NextResponse.json({ error: 'TTS failed', detail: String(err) }, { status: 502 });
  }
}
