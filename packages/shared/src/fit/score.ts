// The deterministic core of the Fit Read (Epic 2, Feature 2.2).
//
// This computes per-dimension 0-100 scores and a weighted overall by comparing a
// candidate's FitProfile against a Role's IdealProfile. It is intentionally
// transparent and deterministic — the plain-language "why this fits" and the honest
// gaps are MODEL-generated narration layered on top (see server/ai.ts), never
// hard-coded here. This is a v0 heuristic meant to be refined as real outcome data
// accrues (the Science Layer sharpens with every match — Data is the flywheel).
//
// Design notes that reflect the product's principles:
//  - Bidirectional traits (personality) use symmetric closeness: a role may want
//    LOW extraversion, so overshooting is not automatically "good".
//  - Capability traits (grit, EI) use meet-or-exceed: clearing the bar scores full.
//  - Skills/values use overlap, not keyword equality — "Story over specification".
//  - Only dimensions the role actually constrains contribute to the overall score;
//    unconstrained dimensions are still reported (for the candidate's own view) but
//    carry zero weight, so we never invent fit the role didn't ask for.

import {
  FIT_DIMENSIONS,
  type FitBreakdown,
  type FitDimension,
  type FitProfile,
  type IdealProfile,
} from '../types/fit';

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

/** Symmetric closeness on a 0-100 scale: identical → 100, far apart → 0. */
const closeness = (a: number, b: number) => clamp(100 - Math.abs(a - b));

/** Meet-or-exceed: at/above target → 100, otherwise proportional shortfall. */
const meetOrExceed = (value: number, target: number) =>
  target <= 0 ? 100 : clamp((value / target) * 100);

/** Jaccard-style overlap of two string sets, case-insensitive. */
function overlap(a: string[] = [], b: string[] = []): number {
  if (b.length === 0) return 100; // role asks for nothing here → no constraint
  const norm = (s: string) => s.trim().toLowerCase();
  const setA = new Set(a.map(norm));
  const required = b.map(norm);
  const hits = required.filter((r) => setA.has(r)).length;
  return clamp((hits / required.length) * 100);
}

function scorePersonality(c: FitProfile, ideal: IdealProfile): number | null {
  const t = ideal.personality;
  if (!t) return null;
  const keys = Object.keys(t) as (keyof typeof t)[];
  if (keys.length === 0) return null;
  const scores = keys.map((k) => closeness(c.personality[k], t[k] as number));
  return avg(scores);
}

function scoreResilience(c: FitProfile, ideal: IdealProfile): number | null {
  const t = ideal.resilienceDrive;
  if (!t || typeof t.gritScore !== 'number') return null;
  return meetOrExceed(c.resilienceDrive.gritScore, t.gritScore);
}

function scoreEmotional(c: FitProfile, ideal: IdealProfile): number | null {
  const t = ideal.emotionalIntelligence;
  if (!t) return null;
  const parts: number[] = [];
  if (typeof t.selfAwareness === 'number')
    parts.push(meetOrExceed(c.emotionalIntelligence.selfAwareness, t.selfAwareness));
  if (typeof t.empathy === 'number')
    parts.push(meetOrExceed(c.emotionalIntelligence.empathy, t.empathy));
  if (typeof t.interpersonalSkill === 'number')
    parts.push(meetOrExceed(c.emotionalIntelligence.interpersonalSkill, t.interpersonalSkill));
  return parts.length ? avg(parts) : null;
}

function scoreSkills(c: FitProfile, ideal: IdealProfile): number | null {
  const t = ideal.skillsExperience;
  if (!t || !t.translatedSkills?.length) return null;
  const candidateSkills = [
    ...(c.skillsExperience.translatedSkills ?? []),
    ...(c.skillsExperience.civilianEquivalents ?? []),
  ];
  return overlap(candidateSkills, t.translatedSkills);
}

function scoreValues(c: FitProfile, ideal: IdealProfile): number | null {
  const t = ideal.motivationValues;
  if (!t || !t.coreValues?.length) return null;
  return overlap(c.motivationValues.coreValues, t.coreValues);
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

const SCORERS: Record<
  FitDimension,
  (c: FitProfile, ideal: IdealProfile) => number | null
> = {
  skillsExperience: scoreSkills,
  personality: scorePersonality,
  resilienceDrive: scoreResilience,
  emotionalIntelligence: scoreEmotional,
  motivationValues: scoreValues,
};

export interface ScoreFitResult extends Omit<FitBreakdown, 'plainLanguageWhy' | 'honestGaps'> {
  /** Dimensions the role constrained (the only ones counted toward `overall`). */
  constrainedDimensions: FitDimension[];
}

/**
 * Compute the numeric portion of a Fit Read. Narration (plainLanguageWhy /
 * honestGaps) is added by the AI layer to produce a full FitBreakdown.
 */
export function scoreFit(candidate: FitProfile, ideal: IdealProfile): ScoreFitResult {
  const dimensionScores = {} as Record<FitDimension, number>;
  const constrained: FitDimension[] = [];

  for (const dim of FIT_DIMENSIONS) {
    const raw = SCORERS[dim](candidate, ideal);
    if (raw === null) {
      // Role didn't constrain this dimension: report a neutral 0 placeholder and
      // leave it out of the weighted overall (zero influence).
      dimensionScores[dim] = 0;
    } else {
      dimensionScores[dim] = Math.round(raw);
      constrained.push(dim);
    }
  }

  const weights = ideal.weights ?? {};
  let weightedSum = 0;
  let weightTotal = 0;
  for (const dim of constrained) {
    const w = weights[dim] ?? 1;
    weightedSum += dimensionScores[dim] * w;
    weightTotal += w;
  }
  const overall = weightTotal > 0 ? Math.round(weightedSum / weightTotal) : 0;

  return { dimensionScores, overall, constrainedDimensions: constrained };
}
