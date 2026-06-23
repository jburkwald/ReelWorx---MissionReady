// The five-dimension fit model shape.
//
// Profile.fitProfile (a person's measured dimensions) and Role.idealProfile (a
// role's target dimensions) share this EXACT shape so the Fit Read (Epic 2) is a
// direct comparison, never a maintained translation layer. The brand display name
// lives in brand.ts (BRAND.assessment), not here.
//
// Built on PUBLIC psychological constructs (Big Five personality, grit/resilience
// research, emotional-intelligence theory, values theory). Do not copy item wording
// from any proprietary instrument. See /docs/DATA_MODEL.md for the IP note.

import type { RootTie } from './domain';

export const FIT_DIMENSIONS = [
  'skillsExperience',
  'personality',
  'resilienceDrive',
  'emotionalIntelligence',
  'motivationValues',
] as const;

export type FitDimension = (typeof FIT_DIMENSIONS)[number];

// Human-readable labels — keep UI copy out of components.
export const FIT_DIMENSION_LABELS: Record<FitDimension, string> = {
  skillsExperience: 'Skills & Experience',
  personality: 'Personality',
  resilienceDrive: 'Resilience & Drive',
  emotionalIntelligence: 'Emotional Intelligence',
  motivationValues: 'Motivation & Values',
};

export interface PersonalityScores {
  extraversion: number; // 0-100
  conscientiousness: number;
  openness: number;
  agreeableness: number;
  emotionalStability: number;
}

export interface FitProfile {
  skillsExperience: {
    translatedSkills: string[];
    mosMapping?: string;
    civilianEquivalents?: string[];
  };
  personality: PersonalityScores;
  resilienceDrive: {
    gritScore: number; // 0-100
    perseveranceIndicators?: string[];
  };
  emotionalIntelligence: {
    selfAwareness: number; // 0-100
    empathy: number;
    interpersonalSkill: number;
  };
  motivationValues: {
    coreValues: string[];
    whatDrivesThem?: string;
    roots?: RootTie[];
  };
}

// A role's target uses the same shape (partial — a role need not constrain every
// dimension), plus optional per-dimension weights so e.g. a sales role can weight
// extraversion + grit + interpersonal EI more heavily than the rest.
export interface IdealProfile extends Partial<FitProfile> {
  weights?: Partial<Record<FitDimension, number>>;
}

// The output of a Fit Read, cached on Match.fitBreakdown. The numeric dimension
// scores are deterministic (see fit/score.ts); the plain-language "why" and the
// honest gaps are model-generated narration layered on top.
export interface FitBreakdown {
  dimensionScores: Record<FitDimension, number>; // 0-100 per dimension
  overall: number; // 0-100 weighted
  plainLanguageWhy: string;
  honestGaps: string[];
}
