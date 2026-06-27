// Profile strength, computed from a stored Profile row — SERVER ONLY.
//
// One mapper so every server path (the story turn, the assessment save, the intro-video
// save, the candidate dashboard) derives strength the SAME way from the SAME fields. The
// math itself lives in the isomorphic ../profile/strength; this only adapts a DB row to it.

import {
  computeProfileStrength,
  foundationCompleteFromSignals,
  profileStrengthScore,
  type ProfileStrength,
  type StrengthInput,
  type VideoStatus,
} from '../profile/strength';
import { hasAssessmentScores } from '../assessment/score';

export interface ProfileStrengthFields {
  headline: string | null;
  fitProfile: unknown;
  whyEachMove: unknown;
  videoIntroUrl: string | null;
  videoIntroAssetId: string | null;
}

interface FitJson {
  skillsExperience?: { translatedSkills?: string[] };
  motivationValues?: { coreValues?: string[]; whatDrivesThem?: string };
}

export function strengthInputFromProfile(
  p: ProfileStrengthFields,
  opts?: { videoStatus?: VideoStatus },
): StrengthInput {
  const fit = (p.fitProfile ?? {}) as FitJson;
  const skills = fit.skillsExperience?.translatedSkills ?? [];
  const values = fit.motivationValues?.coreValues ?? [];
  const whyCount = Array.isArray(p.whyEachMove) ? p.whyEachMove.length : 0;

  const foundationComplete = foundationCompleteFromSignals({
    headline: p.headline,
    skillsCount: skills.length,
    whyEachMoveCount: whyCount,
    valuesCount: values.length,
    hasWhatDrives: Boolean(fit.motivationValues?.whatDrivesThem),
  });

  // The asset id is set the moment the intro video exists (even mid-encode), so a pinned
  // asset counts as ready for strength. A caller mid-upload can pass an explicit status.
  const videoStatus: VideoStatus =
    opts?.videoStatus ?? (p.videoIntroAssetId || p.videoIntroUrl ? 'ready' : 'none');

  return {
    foundationComplete,
    videoStatus,
    assessmentComplete: hasAssessmentScores(p.fitProfile),
  };
}

export function computeProfileStrengthForProfile(
  p: ProfileStrengthFields,
  opts?: { videoStatus?: VideoStatus },
): ProfileStrength {
  return computeProfileStrength(strengthInputFromProfile(p, opts));
}

export function profileStrengthScoreForProfile(
  p: ProfileStrengthFields,
  opts?: { videoStatus?: VideoStatus },
): number {
  return profileStrengthScore(strengthInputFromProfile(p, opts));
}
