// Persist the Veteran Door record (Feature 1.1) — SERVER ONLY.
//
// The structured record is captured by tap-and-select on the client; this saves it without
// a schema change: the headline lands on Profile.headline, the roots become indexed Root
// rows (so Come Home search finds them, 3.3), and the structured fields are stashed under
// Profile.fitProfile.record. Completing the record advances the foundation, so strength is
// recomputed here.

import { recordHeadline, recordRoots, type VeteranRecord } from '../story/record';
import { isDbConfigured } from './demo';
import { setRoots } from './roots';
import { profileStrengthScoreForProfile } from './strength';
import { logEvent } from './events';
import { Prisma, type PrismaClient } from '../generated/prisma/client';

export interface SaveRecordResult {
  completeness: number;
  demo?: boolean;
}

export async function saveVeteranRecord(
  prisma: PrismaClient,
  input: { userId: string; record: VeteranRecord },
): Promise<SaveRecordResult> {
  if (!isDbConfigured()) return { completeness: 0, demo: true };

  const profile = await prisma.profile.findUnique({ where: { userId: input.userId } });
  if (!profile) throw new Error(`No candidate profile for user ${input.userId}`);

  // Keep an existing, richer headline if the story already produced one.
  const headline = profile.headline?.trim() || recordHeadline(input.record) || null;

  // Stash the structured record alongside the fit data (no new column).
  const fit = (profile.fitProfile ?? {}) as Record<string, unknown>;
  const mergedFit = { ...fit, record: input.record };

  // Roots become indexed Root rows + sync User.hometown (setRoots owns that transaction).
  const roots = recordRoots(input.record);
  if (roots.length) {
    await setRoots(prisma, {
      userId: input.userId,
      roots: roots.map((place, i) => ({ place, isPrimary: i === 0 })),
    });
  }

  const completeness = profileStrengthScoreForProfile({
    headline,
    fitProfile: mergedFit,
    whyEachMove: profile.whyEachMove,
    videoIntroUrl: profile.videoIntroUrl,
    videoIntroAssetId: profile.videoIntroAssetId,
  });

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      headline,
      fitProfile: mergedFit as unknown as Prisma.InputJsonValue,
      completenessScore: completeness,
    },
  });

  await logEvent(prisma, {
    actorId: input.userId,
    eventType: 'veteran_record_saved',
    targetId: profile.id,
    metadata: { branch: input.record.branch ?? null, separation: input.record.separation ?? null },
  });

  return { completeness };
}
