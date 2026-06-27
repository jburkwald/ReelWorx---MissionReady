// Premium voice provider — ElevenLabs — SERVER ONLY.
//
// Claude stays the brain (runStoryTurn + the profile extraction). This module is ONLY the
// premium mouth + ears: text-to-speech and speech-to-text via the ElevenLabs REST API,
// using ELEVENLABS_API_KEY. No SDK dependency — plain fetch. When the key is absent every
// function returns null so the web client falls back to the browser's built-in voice, and
// the keyless demo keeps working.
//
// Voice/model/settings defaults live in ../story/voice.ts (VOICE_AGENT.elevenlabs) so the
// premium voice is programmable in one place; callers may override per request.

import { VOICE_AGENT, type ElevenLabsSettings } from '../story/voice';

const API = 'https://api.elevenlabs.io/v1';

function apiKey(): string | null {
  const k = process.env.ELEVENLABS_API_KEY;
  return k && k.trim() ? k.trim() : null;
}

/** What the client asks /api/voice/status — which premium capabilities are live. */
export function voiceProviderConfigured(): { provider: string | null; tts: boolean; stt: boolean } {
  const on = Boolean(apiKey());
  return { provider: on ? 'elevenlabs' : null, tts: on, stt: on };
}

export interface SynthesizeOptions extends Partial<ElevenLabsSettings> {}

export interface SynthesizedSpeech {
  audio: ArrayBuffer;
  contentType: string;
}

/** Speak `text` in the configured premium voice. Returns null if no key (caller falls back). */
export async function synthesizeSpeech(
  text: string,
  opts: SynthesizeOptions = {},
): Promise<SynthesizedSpeech | null> {
  const key = apiKey();
  if (!key || !text.trim()) return null;

  const v = VOICE_AGENT.elevenlabs;
  const voiceId = opts.voiceId ?? v.voiceId;
  const res = await fetch(`${API}/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: {
      'xi-api-key': key,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: opts.modelId ?? v.modelId,
      voice_settings: {
        stability: opts.stability ?? v.stability,
        similarity_boost: opts.similarityBoost ?? v.similarityBoost,
        style: opts.style ?? v.style,
        use_speaker_boost: true,
        speed: opts.speed ?? v.speed,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`ElevenLabs TTS failed: ${res.status} ${await safeBody(res)}`);
  }
  return { audio: await res.arrayBuffer(), contentType: 'audio/mpeg' };
}

/** Transcribe recorded speech. Returns null if no key (caller falls back to browser STT). */
export async function transcribeSpeech(
  audio: Blob | ArrayBuffer,
  filename = 'answer.webm',
): Promise<{ text: string } | null> {
  const key = apiKey();
  if (!key) return null;

  const blob = audio instanceof Blob ? audio : new Blob([audio]);
  const form = new FormData();
  form.append('model_id', 'scribe_v1');
  form.append('file', blob, filename);

  const res = await fetch(`${API}/speech-to-text`, {
    method: 'POST',
    headers: { 'xi-api-key': key },
    body: form,
  });

  if (!res.ok) {
    throw new Error(`ElevenLabs STT failed: ${res.status} ${await safeBody(res)}`);
  }
  const data = (await res.json()) as { text?: string };
  return { text: data.text ?? '' };
}

async function safeBody(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 300);
  } catch {
    return '';
  }
}
