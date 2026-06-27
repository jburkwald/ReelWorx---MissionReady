// Full Spectrum Assessment persistence (Feature 1.5) — SERVER ONLY.
//
// Scores a candidate's responses (deterministically, in shared) and merges the three
// psychometric dimensions into Profile.fitProfile WITHOUT touching the skills/values the
// Story flow gathered — the two halves coexist in one fitProfile. Recomputes the
// profile-strength meter (the assessment is a sizeable, earned jump) and logs the event,
// so the candidate's "taking it raised my strength" moment is real and on the flywheel.

import { profileStrengthScoreForProfile } from './strength';
import { scoreAssessment } from '../assessment/score';
import type { AssessmentResponses } from '../assessment/types';
import { logEvent } from './events';
import { Prisma, type PrismaClient } from '../generated/prisma/client';

export interface SaveAssessmentInput {
  userId: string; // the candidate User.id
  responses: AssessmentResponses;
}

export interface SaveAssessmentResult {
  completeness: number;
}

export async function saveAssessment(
  prisma: PrismaClient,
  input: SaveAssessmentInput,
): Promise<SaveAssessmentResult> {
  const profile = await prisma.profile.findUnique({ where: { userId: input.userId } });
  if (!profile) throw new Error(`No candidate profile for user ${input.userId}`);

  const scores = scoreAssessment(input.responses);

  // Merge over existing fitProfile — keep skills/values/why, add the assessment blocks.
  const existing = (profile.fitProfile ?? {}) as Record<string, unknown>;
  const merged = {
    ...existing,
    personality: scores.personality,
    resilienceDrive: {
      ...(existing.resilienceDrive as object | undefined),
      gritScore: scores.resilienceDrive.gritScore,
    },
    emotionalIntelligence: scores.emotionalIntelligence,
  };

  // Recompute strength from the live profile with the assessment now merged in (the merged
  // fitProfile carries the personality block, so the assessment component reads complete).
  const completeness = profileStrengthScoreForProfile({
    headline: profile.headline,
    fitProfile: merged,
    whyEachMove: profile.whyEachMove,
    videoIntroUrl: profile.videoIntroUrl,
    videoIntroAssetId: profile.videoIntroAssetId,
  });

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      fitProfile: merged as unknown as Prisma.InputJsonValue,
      completenessScore: completeness,
    },
  });

  await logEvent(prisma, {
    actorId: input.userId,
    eventType: 'assessment_completed',
    targetId: profile.id,
    metadata: { completeness },
  });

  return { completeness };
}
