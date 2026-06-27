import { transcribeSpeech } from '@reelworx/shared/server';
import { NextResponse } from 'next/server';

// Premium speech-to-text: transcribes a recorded answer (ElevenLabs Scribe). 501 when no
// key, so the client falls back to the browser's SpeechRecognition.
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart form-data' }, { status: 400 });
  }
  const file = form.get('audio');
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'audio file required' }, { status: 400 });
  }

  try {
    const result = await transcribeSpeech(file, 'answer.webm');
    if (!result) {
      return NextResponse.json({ provider: null }, { status: 501 });
    }
    return NextResponse.json({ text: result.text });
  } catch (err) {
    return NextResponse.json({ error: 'STT failed', detail: String(err) }, { status: 502 });
  }
}
