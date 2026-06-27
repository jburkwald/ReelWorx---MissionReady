// Profile strength — the single, tunable definition (Features 1.5 / 6.2).
//
// Strength is NOT a count of answers. It is the sum of completed COMPONENTS, each with a
// fixed weight and a hard cap. Defined once here so the candidate on mobile and the
// employer-facing view on web read the exact same number. Never compute strength inside a
// UI component.
//
// It is an extensible REGISTRY, not four hardcoded values: future contributors (Living
// Profile chapters 1.6, the Personal Fit Story podcast 2.6, the hiring-manager review)
// add an entry without reworking the model.
//
// Strength is distinct from momentum (6.2). Momentum is activity. Strength is component
// completion. Do not blend them.

import { BRAND } from '../brand';
import { FEATURES } from '../config';

export type StrengthComponentId = 'foundation' | 'video' | 'assessment' | 'review';

export interface StrengthComponentDef {
  id: StrengthComponentId;
  /** User-facing label. Kept human and short; no em dashes. */
  label: string;
  /** Short line on what completing it means. */
  blurb: string;
  weight: number;
  /** Feature-flagged components (e.g. review) are present but not yet counted. */
  enabled: boolean;
}

// THE REGISTRY. Weights and the on/off of reserved components live here, one place to tune.
// Today's achievable max is 90 because `review` is off.
export const STRENGTH_REGISTRY: StrengthComponentDef[] = [
  {
    id: 'foundation',
    label: 'Foundation',
    blurb: 'Your record and your story, in your own words.',
    weight: 35,
    enabled: true,
  },
  {
    id: 'video',
    label: 'Intro video',
    blurb: 'A short, forward-looking hello that shows the person, not the paper.',
    weight: 30,
    enabled: true,
  },
  {
    id: 'assessment',
    label: `${BRAND.assessment} read`,
    blurb: 'A deeper read on who you are across five dimensions.',
    weight: 25,
    enabled: true,
  },
  {
    id: 'review',
    label: 'Hiring manager review',
    blurb: 'An employer who has worked with you vouches for you. Coming soon.',
    weight: 10,
    enabled: FEATURES.hiringManagerReview,
  },
];

// Tier thresholds, surfaced in 6.2. Strength gates visibility ONLY at the foundation,
// never before it, so exploration stays free (the Signal Layer).
export type StrengthTierKey = 'not_started' | 'visible' | 'strong' | 'standout';

export interface StrengthTierDef {
  key: StrengthTierKey;
  /** Score at or above this enters the tier. */
  min: number;
  label: string;
  blurb: string;
  /** Visible or better means the candidate appears in fit reads / suggested matches (2.2). */
  discoverable: boolean;
  /** Earned-celebration gate — only the standout reveal is loud. */
  celebratory: boolean;
}

export const STRENGTH_TIERS: StrengthTierDef[] = [
  { key: 'standout', min: 90, label: 'Standout', blurb: 'A profile to be proud of. You stand out.', discoverable: true, celebratory: true },
  { key: 'strong', min: 60, label: 'Strong', blurb: 'Your story is getting strong.', discoverable: true, celebratory: false },
  { key: 'visible', min: 35, label: 'Visible', blurb: 'Companies can find you now. You are in the running.', discoverable: true, celebratory: false },
  { key: 'not_started', min: 0, label: 'Not started', blurb: 'Build your foundation to become visible to companies.', discoverable: false, celebratory: false },
];

export function strengthTier(score: number): StrengthTierDef {
  return STRENGTH_TIERS.find((t) => score >= t.min) ?? STRENGTH_TIERS[STRENGTH_TIERS.length - 1];
}

// ── Inputs ───────────────────────────────────────────────────────────────────

export type VideoStatus = 'none' | 'processing' | 'ready';

export interface StrengthInput {
  /** Both required foundation phases (record + story) are done. Binary, never scaled. */
  foundationComplete: boolean;
  /** Intro video (1.4): only 'ready' awards the weight; 'processing' shows but awards 0. */
  videoStatus: VideoStatus;
  /** Full Spectrum assessment (1.5) submitted. */
  assessmentComplete: boolean;
  /** Hiring-manager review (reserved; only counts when the flag is on). */
  reviewComplete?: boolean;
}

export type ComponentStatus = 'complete' | 'incomplete' | 'processing' | 'locked';

export interface StrengthComponentState {
  id: StrengthComponentId;
  label: string;
  blurb: string;
  weight: number;
  status: ComponentStatus;
  /** Points this component contributes right now (0 unless complete). */
  awarded: number;
}

export interface ProfileStrength {
  /** Sum of completed enabled weights. Capped at maxScore. */
  score: number;
  /** Sum of enabled weights (90 today; 100 once review ships). */
  maxScore: number;
  tier: StrengthTierDef;
  /** Visible or better — appears in fit reads / suggested matches. */
  discoverable: boolean;
  components: StrengthComponentState[];
}

function isComplete(id: StrengthComponentId, input: StrengthInput): boolean {
  switch (id) {
    case 'foundation':
      return input.foundationComplete;
    case 'video':
      return input.videoStatus === 'ready';
    case 'assessment':
      return input.assessmentComplete;
    case 'review':
      return Boolean(input.reviewComplete);
  }
}

/**
 * The canonical computation. Same inputs, same number, everywhere. Disabled components are
 * rendered as `locked` (their weight is excluded from both score and max), so a candidate
 * is never shown a gap that is not theirs to close.
 */
export function computeProfileStrength(input: StrengthInput): ProfileStrength {
  let score = 0;
  let maxScore = 0;

  const components: StrengthComponentState[] = STRENGTH_REGISTRY.map((def) => {
    if (!def.enabled) {
      return { id: def.id, label: def.label, blurb: def.blurb, weight: def.weight, status: 'locked', awarded: 0 };
    }
    maxScore += def.weight;

    const complete = isComplete(def.id, input);
    if (complete) {
      score += def.weight;
      return { id: def.id, label: def.label, blurb: def.blurb, weight: def.weight, status: 'complete', awarded: def.weight };
    }
    const status: ComponentStatus =
      def.id === 'video' && input.videoStatus === 'processing' ? 'processing' : 'incomplete';
    return { id: def.id, label: def.label, blurb: def.blurb, weight: def.weight, status, awarded: 0 };
  });

  score = Math.min(score, maxScore);
  const tier = strengthTier(score);
  return { score, maxScore, tier, discoverable: tier.discoverable, components };
}

/** Just the stored number (Profile.completenessScore). */
export function profileStrengthScore(input: StrengthInput): number {
  return computeProfileStrength(input).score;
}

// ── Foundation signals ───────────────────────────────────────────────────────
//
// Foundation completion is derived from the data the agent gathers, so "saved progress"
// (the persisted profile) and the meter never drift. Each phase is binary: producing its
// data completes it; extra answers beyond that never move the score.

export interface FoundationSignals {
  headline?: string | null;
  skillsCount: number;
  whyEachMoveCount: number;
  valuesCount: number;
  hasWhatDrives?: boolean;
}

/** Phase 1, "Your record": the basics exist (a headline, or at least one concrete skill). */
export function recordPhaseComplete(s: FoundationSignals): boolean {
  return Boolean(s.headline && s.headline.trim().length > 0) || s.skillsCount >= 1;
}

/** Phase 2, "Your story": the why exists (a move's reason, a value, or what drives them). */
export function storyPhaseComplete(s: FoundationSignals): boolean {
  return s.whyEachMoveCount >= 1 || s.valuesCount >= 1 || Boolean(s.hasWhatDrives);
}

export function foundationCompleteFromSignals(s: FoundationSignals): boolean {
  return recordPhaseComplete(s) && storyPhaseComplete(s);
}
