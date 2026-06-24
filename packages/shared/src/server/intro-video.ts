// Intro Video persistence (Feature 1.4, "without the fear") — SERVER ONLY.
//
// Two steps, both serverless-safe (no long polling): (1) hand the client a Mux direct-
// upload target so the large video never proxies through us, then (2) once the client has
// PUT the file, resolve the asset and pin it to the Profile. Provider-agnostic — all Mux
// specifics stay behind the media interface, matching `videoProvider`/`videoAssetId` in
// the schema, so a host swap is never a migration.
//
// The intro video is the dormant 15-point slice of profile strength (completeness.ts);
// finishing it is an earned jump, credited the moment the asset exists (even mid-encode),
// so the candidate's payoff doesn't wait on Mux.

import { computeProfileCompleteness } from '../story/completeness';
import { hasAssessmentScores } from '../assessment/score';
import { media } from './media';
import { logEvent } from './events';
import type { DirectUpload } from '../media/types';
import type { PrismaClient } from '../generated/prisma/client';

/** Step 1: a direct-upload target the candidate's device PUTs the recording to. */
export function createIntroVideoUpload(corsOrigin?: string): Promise<DirectUpload> {
  return media.createVideoUpload({ corsOrigin });
}

export interface SaveIntroVideoResult {
  status: 'ready' | 'processing';
  completeness: number;
  posterUrl: string | null;
  hlsUrl: string | null;
}

/**
 * Step 2: resolve the uploaded asset and pin it to the Profile. Single attempt — if the
 * provider hasn't ingested the file yet (no assetId), returns `processing` and persists
 * nothing; the client retries. Once an asset exists, credits intro-video strength and
 * stores the (provider-agnostic) asset id + playback URL.
 */
export async function saveIntroVideo(
  prisma: PrismaClient,
  input: { userId: string; uploadId: string },
): Promise<SaveIntroVideoResult> {
  const profile = await prisma.profile.findUnique({ where: { userId: input.userId } });
  if (!profile) throw new Error(`No candidate profile for user ${input.userId}`);

  const asset = await media.getUploadAsset(input.uploadId);

  if (!asset.assetId) {
    // Still ingesting — don't credit anything yet; report current strength so the UI
    // can show "processing" without a regression.
    return {
      status: 'processing',
      completeness: profile.completenessScore,
      posterUrl: null,
      hlsUrl: null,
    };
  }

  const hlsUrl = asset.playback?.hlsUrl ?? null;

  // Recompute strength from the live profile, now crediting the intro video.
  const fit = (profile.fitProfile ?? {}) as {
    skillsExperience?: { translatedSkills?: string[] };
    motivationValues?: { coreValues?: string[] };
  };
  const completeness = computeProfileCompleteness({
    hasIntroVideo: true,
    headline: profile.headline,
    skillsCount: fit.skillsExperience?.translatedSkills?.length ?? 0,
    valuesCount: fit.motivationValues?.coreValues?.length ?? 0,
    whyEachMoveCount: Array.isArray(profile.whyEachMove) ? profile.whyEachMove.length : 0,
    hasFitProfile:
      (fit.skillsExperience?.translatedSkills?.length ?? 0) > 0 ||
      (fit.motivationValues?.coreValues?.length ?? 0) > 0,
    hasAssessment: hasAssessmentScores(profile.fitProfile),
    chaptersCount: Array.isArray(profile.livingProfileChapters)
      ? profile.livingProfileChapters.length
      : 0,
  });

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      videoIntroAssetId: asset.assetId,
      videoIntroUrl: hlsUrl,
      completenessScore: completeness,
    },
  });

  await logEvent(prisma, {
    actorId: input.userId,
    eventType: 'intro_video_added',
    targetId: profile.id,
    metadata: { assetId: asset.assetId, ready: asset.ready },
  });

  return {
    status: asset.ready ? 'ready' : 'processing',
    completeness,
    posterUrl: asset.playback?.posterUrl ?? null,
    hlsUrl,
  };
}
