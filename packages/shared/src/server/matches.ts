// Match service — the Fit Read lands here (Epic 2, Feature 2.2) — SERVER ONLY.
//
// Karen's story: "I want the people I see to actually fit." This ranks the candidate
// pool against a role's Full Spectrum target, narrates the top few, and persists them as
// Match rows with the Fit Read cached on Match.fitBreakdown.
//
// Three product principles are load-bearing here:
//  - Signal over volume: we rank and CAP (default 10 — "fewer, better"). We never dump
//    the whole pool on the employer.
//  - Data is the flywheel: every suggestion is a logged match_created Event and a cached
//    breakdown, so Release-2 dashboards and a sharpening model come for free.
//  - Respect visibility: only candidates who are discoverable to companies are scored
//    (Profile.visibility public | companies_only — never `private`).

import { scoreFit, normalizeFitProfile } from '../fit/score';
import { fitTier, type FitTier } from '../fit/score';
import type { FitBreakdown, IdealProfile } from '../types/fit';
import type { DecodedCredibility } from '../types/credibility';
import { buildFitRead } from './narrate';
import { ensureDecodedCredibility } from './decode';
import { EVENT_TYPES, logEvent } from './events';
import { Prisma, type PrismaClient } from '../generated/prisma/client';

/** Everything the company surface needs about one suggested person — fully serializable. */
export interface CandidateSummary {
  candidateId: string;
  /** Derived handle (names live in Clerk, not the DB) — headline is the real identifier. */
  displayName: string;
  headline: string | null;
  hometown: string | null;
  currentLocation: string | null;
  mosTranslation: string | null;
  /** The employer's read — service record decoded into business language (Feature 2.7). */
  decoded: DecodedCredibility | null;
  completenessScore: number;
}

export type MatchStatusView = 'suggested' | 'applied' | 'invited' | 'connected' | 'passed';

export interface SuggestedMatch {
  matchId: string | null; // null until persisted (preview ranking)
  candidate: CandidateSummary;
  breakdown: FitBreakdown;
  tier: FitTier;
  /** Where this match sits in the funnel — drives the "Reach out" vs "Invited" UI. */
  status: MatchStatusView;
}

const DEFAULT_LIMIT = 10;

const candidateInclude = {
  user: true,
} as const;

function summarize(
  profile: { headline: string | null; mosTranslation: string | null; completenessScore: number },
  user: { id: string; email: string; hometown: string | null; currentLocation: string | null },
  decoded: DecodedCredibility | null,
): CandidateSummary {
  return {
    candidateId: user.id,
    displayName: user.email.split('@')[0],
    headline: profile.headline,
    hometown: user.hometown,
    currentLocation: user.currentLocation,
    mosTranslation: profile.mosTranslation,
    decoded,
    completenessScore: profile.completenessScore,
  };
}

/**
 * Score the visible candidate pool against a role, narrate the top `limit`, persist each
 * as a Match (upsert — re-running refreshes the read without losing a connection's
 * progress), and return them ranked best-first.
 */
export async function suggestMatchesForRole(
  prisma: PrismaClient,
  input: { roleId: string; actorUserId: string; limit?: number },
): Promise<SuggestedMatch[]> {
  const limit = input.limit ?? DEFAULT_LIMIT;

  const role = await prisma.role.findUnique({ where: { id: input.roleId } });
  if (!role) throw new Error(`Role ${input.roleId} not found`);
  const ideal = (role.idealProfile ?? {}) as IdealProfile;

  // Only candidates who are discoverable to companies and have something to read.
  const profiles = await prisma.profile.findMany({
    where: {
      visibility: { in: ['public', 'companies_only'] },
      fitProfile: { not: Prisma.JsonNull },
    },
    include: candidateInclude,
  });

  // Rank deterministically first (cheap) — only the top `limit` pay for AI narration.
  const ranked = profiles
    .map((p) => {
      const candidate = normalizeFitProfile(p.fitProfile);
      const score = scoreFit(candidate, ideal);
      return { p, candidate, overall: score.overall };
    })
    .sort((a, b) => b.overall - a.overall)
    .slice(0, limit);

  const results: SuggestedMatch[] = [];
  for (const { p, candidate } of ranked) {
    // The employer's read of this person — generated once, cached on the Profile,
    // reused across every role they're matched to.
    const decoded = await ensureDecodedCredibility(prisma, p, { hometown: p.user.hometown });

    const breakdown = await buildFitRead(candidate, ideal, {
      roleTitle: role.title,
      candidateHeadline: p.headline,
      mosTranslation: decoded.businessSummary,
    });

    // Upsert: refresh the cached read on re-run, but never downgrade status — a Match
    // that already reached `applied`/`invited`/`connected` keeps its place in the funnel.
    const match = await prisma.match.upsert({
      where: {
        candidateId_organizationId_roleId: {
          candidateId: p.user.id,
          organizationId: role.organizationId,
          roleId: role.id,
        },
      },
      create: {
        candidateId: p.user.id,
        organizationId: role.organizationId,
        roleId: role.id,
        fitScore: breakdown.overall,
        fitBreakdown: breakdown as unknown as Prisma.InputJsonValue,
      },
      update: {
        fitScore: breakdown.overall,
        fitBreakdown: breakdown as unknown as Prisma.InputJsonValue,
      },
    });

    await logEvent(prisma, {
      actorId: input.actorUserId,
      eventType: EVENT_TYPES.matchCreated,
      targetId: match.id,
      metadata: { roleId: role.id, candidateId: p.user.id, fitScore: breakdown.overall },
    });

    results.push({
      matchId: match.id,
      candidate: summarize(p, p.user, decoded),
      breakdown,
      tier: fitTier(breakdown.overall),
      status: match.status as MatchStatusView,
    });
  }

  return results;
}

/**
 * Read already-computed suggestions for a role from persisted Matches (no AI, no
 * recompute). This is what the surface loads on a normal page view; suggestMatchesForRole
 * is the explicit, costed "run the Fit Read" action.
 */
export async function getMatchesForRole(
  prisma: PrismaClient,
  roleId: string,
): Promise<SuggestedMatch[]> {
  const matches = await prisma.match.findMany({
    where: { roleId },
    orderBy: { fitScore: 'desc' },
    include: { candidate: { include: { profile: true } } },
  });

  return matches
    .filter((m) => m.fitBreakdown && m.candidate.profile)
    .map((m) => {
      const breakdown = m.fitBreakdown as unknown as FitBreakdown;
      const profile = m.candidate.profile!;
      const decoded = (profile.decodedCredibility ?? null) as DecodedCredibility | null;
      return {
        matchId: m.id,
        candidate: summarize(profile, m.candidate, decoded),
        breakdown,
        tier: fitTier(breakdown.overall),
        status: m.status as MatchStatusView,
      };
    });
}
