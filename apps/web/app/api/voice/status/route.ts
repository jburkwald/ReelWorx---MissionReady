import { voiceProviderConfigured } from '@reelworx/shared/server';
import { NextResponse } from 'next/server';

// Tells the client whether premium voice (ElevenLabs) is live. When false, the client uses
// the browser's built-in speech, so the keyless demo still talks and listens.
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json(voiceProviderConfigured());
}
