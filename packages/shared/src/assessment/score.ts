// Full Spectrum scoring (Feature 1.5) — deterministic, isomorphic.
//
// Turns 1–5 Likert responses into 0–100 facet scores. Transparent and reproducible (a
// measurement, not an inference): each answered item maps to 0–100, reverse-keyed items
// are flipped, and a facet is the mean of its answered items. This is "our own scoring"
// the backlog calls for — defensible because the constructs are public and the math is
// in the open.

import { ASSESSMENT_ITEMS } from './items';
import type {
  AssessmentResponses,
  AssessmentScores,
  LikertValue,
} from './types';

/** Likert 1..5 → 0..100, flipping reverse-keyed items. */
function itemScore(value: LikertValue, reverse?: boolean): number {
  const v = reverse ? 6 - value : value; // 1↔5, 2↔4, 3 stays
  return ((v - 1) / 4) * 100;
}

const mean = (xs: number[]) =>
  xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0;

/** Mean 0–100 over the answered items belonging to one facet. */
function facetScore(responses: AssessmentResponses, facet: string): number {
  const scores: number[] = [];
  for (const item of ASSESSMENT_ITEMS) {
    if (item.facet !== facet) continue;
    const r = responses[item.id];
    if (r === undefined) continue;
    scores.push(itemScore(r, item.reverse));
  }
  return mean(scores);
}

export function scoreAssessment(responses: AssessmentResponses): AssessmentScores {
  return {
    personality: {
      extraversion: facetScore(responses, 'extraversion'),
      conscientiousness: facetScore(responses, 'conscientiousness'),
      openness: facetScore(responses, 'openness'),
      agreeableness: facetScore(responses, 'agreeableness'),
      emotionalStability: facetScore(responses, 'emotionalStability'),
    },
    resilienceDrive: { gritScore: facetScore(responses, 'gritScore') },
    emotionalIntelligence: {
      selfAwareness: facetScore(responses, 'selfAwareness'),
      empathy: facetScore(responses, 'empathy'),
      interpersonalSkill: facetScore(responses, 'interpersonalSkill'),
    },
  };
}

/**
 * Whether a stored fitProfile already carries assessment-derived dimensions. The Story
 * flow only ever writes skills + values, so the presence of a personality block is a
 * reliable "assessment taken" signal — used to keep the profile-strength meter consistent
 * when other flows recompute it (no extra DB column needed).
 */
export function hasAssessmentScores(fitProfile: unknown): boolean {
  const p = fitProfile as { personality?: Record<string, unknown> } | null | undefined;
  return Boolean(p?.personality && Object.keys(p.personality).length > 0);
}
