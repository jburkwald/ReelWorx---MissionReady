// Story Profile build flow (Feature 1.2) — shared types + client-facing copy.
//
// The agent draws out a person's story one thread at a time and returns structured
// extractions that feed the Profile. These types are isomorphic; the agent's system
// prompt lives in prompts.ts (server-only, kept out of the mobile bundle).

export type ChatRole = 'user' | 'assistant';

export interface StoryMessage {
  role: ChatRole;
  content: string;
}

export type StoryEntryMode = 'talk' | 'upload' | 'text';

// What the agent can pull out of the conversation and persist to the Profile.
// Mirrors the shape of save_profile_progress (prompts.ts) and maps onto FitProfile.
export interface ProfileExtraction {
  headline?: string;
  skills?: string[];
  civilianEquivalents?: string[];
  coreValues?: string[];
  whatDrivesThem?: string;
  whyEachMove?: { role: string; why: string }[];
  /** Single place they're from — the "Come Home" target (distinct from openTo). */
  hometown?: string;
  /** Places they'd consider relocating to (zero, one, or many). */
  openTo?: string[];
}

export interface StoryTurnResult {
  reply: string;
  extraction?: ProfileExtraction;
}

// The agent's warm opener. Hardcoded (not model-generated) so the conversation can
// start instantly with no latency and no API call, and so the first thing an anxious
// person reads is deliberate, low-pressure, and consistent. Autonomy + no overwhelm.
export const STORY_OPENER =
  "I'd love to hear your story — not a resume, just you. We can talk it through one " +
  "piece at a time, and there's no rush. You can stop whenever you want and pick up " +
  "right where you left off.\n\nWant to start with where you served, or with what " +
  "you're hoping comes next?";
