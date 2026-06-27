// The spoken Story Profile guide — the ONE place to program how the voice agent talks
// (Feature 1.2, the voice entry mode). Isomorphic: the web/mobile speech layers read the
// delivery settings, and the server folds the spoken-style addendum into the agent's
// system prompt so the WORDS are shaped for the ear, not just the eye.
//
// Two layers you can tune here:
//   1. Words  — `persona` + `spokenStyleAddendum` shape what the LLM says in voice mode.
//   2. Delivery — `delivery` controls the voice, rate, pitch the device speaks it with.
//
// The LLM-to-profile translation is unchanged: the same agent + save_profile_progress
// tool (server/agent.ts) extracts spoken answers into the Full Spectrum profile shape.

export interface VoiceDelivery {
  /** BCP-47 language tag for recognition + synthesis. */
  lang: string;
  /** Speaking rate. Web Speech allows 0.1–10; ~0.9–1.05 sounds natural. */
  rate: number;
  /** Voice pitch, 0–2 (1 = default). */
  pitch: number;
  /** Output volume, 0–1. */
  volume: number;
  /**
   * Preferred synthesized voices, best-first. The first one available on the device wins;
   * otherwise the system default is used. Names vary by OS/browser, so we list several.
   */
  preferredVoices: string[];
}

// Premium voice (ElevenLabs) settings — used server-side when ELEVENLABS_API_KEY is set.
// All non-secret, so they live here for one-place tuning. When no key is present the app
// falls back to the browser's built-in voice (VoiceDelivery above).
export interface ElevenLabsSettings {
  /** Voice id from the ElevenLabs library. Default is a steady, warm narrator. */
  voiceId: string;
  /** Model id. Turbo v2.5 is low-latency and supports speed/style. */
  modelId: string;
  /** 0–1. Lower = more expressive/variable, higher = more consistent. */
  stability: number;
  /** 0–1. How closely to match the source voice timbre. */
  similarityBoost: number;
  /** 0–1. Style exaggeration. */
  style: number;
  /** 0.7–1.2. Speaking speed. */
  speed: number;
}

export interface VoiceAgentConfig {
  /** Working name for the guide's voice. */
  name: string;
  /** One-line persona, shown in the UI and usable in prompts. */
  persona: string;
  /**
   * Folded into the agent's system prompt ONLY in voice mode. Governs word choice for the
   * ear: short, one question, no markdown. Tune this to change how the spoken guide talks.
   */
  spokenStyleAddendum: string;
  /** Ear-friendly greeting, spoken first in voice mode (kept apart from the typed opener). */
  spokenOpener: string;
  /** Browser fallback voice (no key needed). */
  delivery: VoiceDelivery;
  /** Premium provider settings (active when ELEVENLABS_API_KEY is set). */
  elevenlabs: ElevenLabsSettings;
}

export const VOICE_AGENT: VoiceAgentConfig = {
  name: 'Bridge',
  persona: 'A steady recruiter who has your back. Warm, direct, never corporate.',
  spokenStyleAddendum:
    'You are speaking OUT LOUD and the person is answering by voice. Keep every reply to one or two short spoken sentences a person can follow by ear. Ask exactly one question per turn. Never use lists, markdown, headings, or emojis. Use natural contractions. In a few words, acknowledge what they just said before you ask the next thing.',
  spokenOpener:
    "I'd love to hear your story. Not a resume, just you. We'll take it one piece at a time, and you can stop whenever you want. To start, tell me where you served, or what you're hoping to do next.",
  delivery: {
    lang: 'en-US',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    preferredVoices: [
      // Best-first across Chrome / Windows / macOS. First available match wins.
      'Google US English',
      'Microsoft Aria Online (Natural) - English (United States)',
      'Microsoft Ava Online (Natural) - English (United States)',
      'Microsoft Guy Online (Natural) - English (United States)',
      'Samantha',
      'Microsoft Zira - English (United States)',
      'Microsoft David - English (United States)',
    ],
  },
  elevenlabs: {
    // "Adam" — a steady, warm public voice that fits the recruiter-with-your-back persona.
    // Swap voiceId for any voice in your ElevenLabs library.
    voiceId: 'pNInz6obpgDQGcFmaJgB',
    modelId: 'eleven_turbo_v2_5',
    stability: 0.45,
    similarityBoost: 0.75,
    style: 0.3,
    speed: 1.0,
  },
};
