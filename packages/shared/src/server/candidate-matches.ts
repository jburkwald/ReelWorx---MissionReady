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
import {
  MONTHLY_APPLICATION_ALLOTMENT,
  getApplicationBalance,
  getReadyApplicationBalance,
  spendApplicationToken,
} from './tokens';
import { logEvent } from './events';
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

/** The candidate's spendable outreach (application) tokens. */
export function getCandidateReachBalance(prisma: PrismaClient, userId: string): Promise<number> {
  return getReadyApplicationBalance(prisma, userId);
}

export type ApplyStatus = 'applied' | 'already' | 'out_of_tokens' | 'role_missing';

export interface ApplyResult {
  ok: boolean;
  status: ApplyStatus;
  balance: number;
  demo?: boolean;
}

/**
 * Intentful reach from the candidate (Feature 3.2): spend one application token and mark the
 * Match as `applied`. Idempotent — re-applying doesn't spend again. Keyless demo returns a
 * believable result so the walk-through gets the "I reached out" moment without a DB.
 */
export async function applyToRole(
  prisma: PrismaClient,
  input: { userId: string; roleId: string },
): Promise<ApplyResult> {
  if (!isDbConfigured()) {
    return { ok: true, status: 'applied', balance: MONTHLY_APPLICATION_ALLOTMENT - 1, demo: true };
  }

  const role = await prisma.role.findUnique({ where: { id: input.roleId } });
  if (!role) return { ok: false, status: 'role_missing', balance: 0 };

  const key = {
    candidateId_organizationId_roleId: {
      candidateId: input.userId,
      organizationId: role.organizationId,
      roleId: role.id,
    },
  };

  const existing = await prisma.match.findUnique({ where: key });
  if (existing && ['applied', 'invited', 'connected'].includes(existing.status)) {
    return { ok: true, status: 'already', balance: await getApplicationBalance(prisma, input.userId) };
  }

  const spent = await spendApplicationToken(prisma, input.userId, role.id);
  if (!spent) return { ok: false, status: 'out_of_tokens', balance: 0 };

  await prisma.match.upsert({
    where: key,
    create: {
      candidateId: input.userId,
      organizationId: role.organizationId,
      roleId: role.id,
      status: 'applied',
    },
    update: { status: 'applied' },
  });

  await logEvent(prisma, {
    actorId: input.userId,
    eventType: 'candidate_applied',
    targetId: role.id,
    metadata: { organizationId: role.organizationId },
  });

  return { ok: true, status: 'applied', balance: await getApplicationBalance(prisma, input.userId) };
}
