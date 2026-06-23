// Anthropic (Claude) client factory — SERVER ONLY.
//
// Powers the emotionally-aware onboarding agent (Feature 1.2), the Fit Read / Decoded
// Credibility narration (2.7), and Path Discovery reasoning (2.1). Lazily constructed
// so importing this module never throws when ANTHROPIC_API_KEY is absent.

import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY is not set — required for the onboarding agent and Fit Read narration.',
      );
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

// Model selection by job. Use the most capable model where the human stakes are
// highest (the onboarding agent drawing out a person's story), and the fast model
// for high-volume classification (e.g. learning from a path rejection).
export const MODELS = {
  /** Emotionally-aware onboarding agent — quality matters most here. */
  agent: 'claude-opus-4-8',
  /** Fit Read / Decoded Credibility / path-discovery narration. */
  narration: 'claude-sonnet-4-6',
  /** High-volume, low-latency classification and tagging. */
  fast: 'claude-haiku-4-5-20251001',
} as const;

export type ModelRole = keyof typeof MODELS;
