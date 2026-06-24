// The Full Spectrum Assessment (Feature 1.5) — shared types.
//
// A structured self-report instrument that fills the three psychometric dimensions the
// conversational Story flow (1.2) can't measure from a story alone: personality, drive,
// and emotional intelligence. Skills & values come from the Story flow; together the two
// cover all five Full Spectrum dimensions.
//
// Deterministic scoring on purpose — a measurement should be reproducible, not subject to
// model variance. Items are ORIGINAL wording built on PUBLIC constructs (Big Five, grit,
// EI theory); per docs/DATA_MODEL.md we never copy item text from a proprietary
// instrument, and the brand name ("Full Spectrum", pending TM) lives only in brand.ts.

import type { PersonalityScores } from '../types/fit';

// The dimensions this instrument measures (a subset of the five — skills/values are
// drawn from the Story conversation instead).
export type AssessmentDimension =
  | 'personality'
  | 'resilienceDrive'
  | 'emotionalIntelligence';

export interface AssessmentItem {
  id: string;
  statement: string;
  dimension: AssessmentDimension;
  /** Sub-scale: a Big Five facet, 'gritScore', or an EI facet. */
  facet: string;
  /** When true, agreement counts AGAINST the facet (keeps a response set honest). */
  reverse?: boolean;
}

export type LikertValue = 1 | 2 | 3 | 4 | 5;
export type AssessmentResponses = Record<string, LikertValue>;

// value 1..5 → label. Index i corresponds to LikertValue (i + 1).
export const LIKERT_LABELS = [
  'Strongly disagree',
  'Disagree',
  'Neutral',
  'Agree',
  'Strongly agree',
] as const;

// Friendly section titles for the assessment UI (keeps copy out of the screen).
export const ASSESSMENT_DIMENSION_LABELS: Record<AssessmentDimension, string> = {
  personality: 'How you’re wired',
  resilienceDrive: 'Drive & staying power',
  emotionalIntelligence: 'Working with people',
};

// The instrument's output — a partial FitProfile carrying only the dimensions it measures.
// Merges into Profile.fitProfile alongside the Story flow's skills/values.
export interface AssessmentScores {
  personality: PersonalityScores;
  resilienceDrive: { gritScore: number };
  emotionalIntelligence: {
    selfAwareness: number;
    empathy: number;
    interpersonalSkill: number;
  };
}
