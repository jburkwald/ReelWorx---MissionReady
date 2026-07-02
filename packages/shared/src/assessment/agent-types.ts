// Full Spectrum Assessment AGENT (conversational, Feature 1.5 evolution) — isomorphic.
//
// The deterministic Likert instrument (items.ts/score.ts) remains as the structured
// fallback, but the primary UX is this agent: a real conversation that reads Personality,
// Emotional & Interpersonal Intelligence, and Resilience & Drive from STORIES, not
// self-ratings. Skills & Experience stay on the resume/Reel side; Motivation & Values
// stay in the foundation conversation. The agent's numeric output lands in the exact
// same fitProfile blocks the instrument fills, so Match/strength/Fit Read are untouched.

import type { PersonalityScores } from '../types/fit';

// What the agent extracts as the conversation runs. All fields optional — the agent
// updates running estimates as evidence accumulates and only flips `complete` (with the
// two narratives) when it has real signal across all three dimensions.
export interface AssessmentAgentExtraction {
  personality?: PersonalityScores;
  gritScore?: number;
  perseveranceIndicators?: string[];
  eq?: {
    selfAwareness: number;
    empathy: number;
    interpersonalSkill: number;
  };
  /** What actually gets them out of bed — separate from what sounds good. */
  motivationSource?: string;
  /** True only when the agent judges it has enough signal across all three dimensions. */
  complete?: boolean;
  /** Candidate-facing reflection — warm, mentor-voiced, shown to the person. */
  candidateReflection?: string;
  /** The Insight primitive — 150-250 words a hiring manager reads in ninety seconds. */
  hiringManagerNarrative?: string;
}

export interface AssessmentTurnResult {
  reply: string;
  read?: AssessmentAgentExtraction;
}

// Hardcoded opener (mirrors STORY_OPENER's rationale): instant start, no API latency,
// and the first thing the person reads is deliberate — this is not a test.
export const ASSESSMENT_OPENER =
  "This part isn't a test. There are no right answers and nothing to study for — I'm " +
  'just going to ask for a few real stories, because how you actually handled a real ' +
  'Tuesday says more than any rating scale ever could.\n\nFirst one: tell me about a ' +
  'time a plan fell apart on you. What did you do in the first ten minutes?';
