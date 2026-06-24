// Profile-strength computation (Feature 1.2 / 6.2).
//
// Deterministic and shared so the meter the candidate sees and the score the server
// stores are the SAME number. Framed as growth, never deficiency: every contribution
// adds; nothing is ever subtracted or shown as "missing/failed". Goal-gradient — the
// closer to 100, the more visible the remaining steps.

export interface ProfileCompletenessInput {
  hasIntroVideo: boolean;
  headline?: string | null;
  skillsCount: number;
  valuesCount: number;
  whyEachMoveCount: number;
  hasFitProfile: boolean; // any Full Spectrum dimensions captured
  hasAssessment: boolean; // the Full Spectrum Assessment (1.5) has been taken
  chaptersCount: number; // living-profile chapters
}

// Weights sum to 100. Tuned so early, low-effort steps (talking through your story)
// move the meter meaningfully — momentum matters most at the start. The Full Spectrum
// Assessment is a deliberate, sizeable single jump (20): "taking it visibly raises your
// profile strength, so going deeper is rewarded" (Feature 1.5).
const WEIGHTS = {
  headline: 10,
  introVideo: 15,
  skills: 15, // full credit at 3+
  values: 10, // full credit at 3+
  whyEachMove: 10, // full credit at 2+
  fitProfile: 15,
  assessment: 20,
  chapters: 5, // full credit at 1+
} as const;

const ratio = (count: number, full: number) => Math.min(count, full) / full;

export function computeProfileCompleteness(
  input: ProfileCompletenessInput,
): number {
  let score = 0;
  if (input.headline && input.headline.trim().length > 0) score += WEIGHTS.headline;
  if (input.hasIntroVideo) score += WEIGHTS.introVideo;
  score += ratio(input.skillsCount, 3) * WEIGHTS.skills;
  score += ratio(input.valuesCount, 3) * WEIGHTS.values;
  score += ratio(input.whyEachMoveCount, 2) * WEIGHTS.whyEachMove;
  if (input.hasFitProfile) score += WEIGHTS.fitProfile;
  if (input.hasAssessment) score += WEIGHTS.assessment;
  score += ratio(input.chaptersCount, 1) * WEIGHTS.chapters;
  return Math.round(Math.min(100, score));
}
