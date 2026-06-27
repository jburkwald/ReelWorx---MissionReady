// Candidate-side Fit Read (Feature 2.2, Dana's view) — SERVER ONLY.
//
// "Companies that suit me, surfaced with a reason." The mirror of the employer Fit Read:
// score THIS candidate's Full Spectrum profile against every role's target and return the
// best fits, each with a plain, honest reason and the one place to grow. Deterministic and
// keyless (no AI needed) so it works in the demo; the company side keeps the AI narration.

import { scoreFit, normalizeFitProfile, fitTier, type FitTier } from '../fit/score';
import {
  FIT_DIMENSION_LABELS,
  type FitDimension,
  type IdealProfile,
} from '../types/fit';
import { isDbConfigured, demoCandidateFitReads } from './demo';
import type { PrismaClient } from '../generated/prisma/client';

export interface CandidateFitRead {
  roleId: string;
  roleTitle: string;
  company: string;
  location: string | null;
  overall: number;
  tier: FitTier;
  /** Plain-language reason this role suits them. */
  why: string;
  /** The single honest place to grow, or null when there's no material gap. */
  gap: string | null;
}

/** Deterministic, honest explainer from the score breakdown — no AI, so it runs anywhere. */
function explain(
  dimensionScores: Record<FitDimension, number>,
  constrained: FitDimension[],
): { why: string; gap: string | null } {
  const ranked = constrained
    .map((d) => ({ d, s: dimensionScores[d] ?? 0 }))
    .sort((a, b) => b.s - a.s);
  const strong = ranked.filter((x) => x.s >= 60).slice(0, 2).map((x) => FIT_DIMENSION_LABELS[x.d]);
  const lowest = ranked[ranked.length - 1];

  const why = strong.length
    ? `A strong match on ${strong.join(' and ')}.`
    : 'Worth a look based on the whole of who you are.';
  const gap = lowest && lowest.s < 55 ? `Room to grow on ${FIT_DIMENSION_LABELS[lowest.d]}.` : null;
  return { why, gap };
}

export async function getCandidateFitReads(
  prisma: PrismaClient,
  userId: string,
  limit = 6,
): Promise<CandidateFitRead[]> {
  if (!isDbConfigured()) return demoCandidateFitReads();

  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile?.fitProfile) return [];
  const candidate = normalizeFitProfile(profile.fitProfile);

  const roles = await prisma.role.findMany({ include: { organization: true }, take: 50 });

  return roles
    .map((r) => {
      const ideal = (r.idealProfile ?? {}) as IdealProfile;
      const score = scoreFit(candidate, ideal);
      const { why, gap } = explain(score.dimensionScores, score.constrainedDimensions);
      return {
        roleId: r.id,
        roleTitle: r.title,
        company: r.organization?.name ?? 'A planted-flag company',
        location: r.location,
        overall: score.overall,
        tier: fitTier(score.overall),
        why,
        gap,
      };
    })
    .filter((x) => x.overall > 0)
    .sort((a, b) => b.overall - a.overall)
    .slice(0, limit);
}
