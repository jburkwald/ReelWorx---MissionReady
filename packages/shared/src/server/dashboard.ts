// Dashboards (Epic 6) — SERVER ONLY.
//
// "Truth they can act on." Both sides finally cash in the Event/Match data we've logged
// from day one. The employer view (6.1) is Karen's proof it's working — engagement →
// connection. The candidate view (6.2) is Marcus's momentum — strength, who's interested,
// where he is on a path. Everything here reports REAL state (Match statuses, token spend,
// saved paths); we never invent a number to make the screen look busier.

import { getInviteBalance } from './tokens';
import { type PrismaClient } from '../generated/prisma/client';

// ── Employer (6.1) ─────────────────────────────────────────────────────────

export interface RecentReachOut {
  candidate: string; // headline or handle
  roleTitle: string | null;
  at: string;
}

export interface EmployerDashboard {
  openRoles: number;
  candidatesSurfaced: number; // distinct people read against this org's roles
  reachedOut: number; // matches the org has spent intent on
  connected: number;
  tokensLeft: number;
  tokensSpentThisMonth: number;
  recent: RecentReachOut[];
}

function startOfMonthUTC(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function getEmployerDashboard(
  prisma: PrismaClient,
  organizationId: string,
): Promise<EmployerDashboard> {
  const [openRoles, distinctPeople, byStatus, tokensLeft, tokensSpentThisMonth, recentRows] =
    await Promise.all([
      prisma.role.count({ where: { organizationId } }),
      prisma.match.findMany({
        where: { organizationId },
        select: { candidateId: true },
        distinct: ['candidateId'],
      }),
      prisma.match.groupBy({
        by: ['status'],
        where: { organizationId },
        _count: true,
      }),
      getInviteBalance(prisma, organizationId),
      prisma.token.count({
        where: {
          organizationId,
          type: 'invite',
          status: 'spent',
          createdAt: { gte: startOfMonthUTC() },
        },
      }),
      prisma.match.findMany({
        where: { organizationId, status: { in: ['invited', 'connected'] } },
        orderBy: { updatedAt: 'desc' },
        take: 6,
        include: { candidate: { include: { profile: true } }, role: true },
      }),
    ]);

  const count = (s: string) =>
    byStatus.filter((g) => g.status === s).reduce((n, g) => n + g._count, 0);

  return {
    openRoles,
    candidatesSurfaced: distinctPeople.length,
    reachedOut: count('invited') + count('connected'),
    connected: count('connected'),
    tokensLeft,
    tokensSpentThisMonth,
    recent: recentRows.map((m) => ({
      candidate: m.candidate.profile?.headline ?? m.candidate.email.split('@')[0],
      roleTitle: m.role?.title ?? null,
      at: m.updatedAt.toISOString(),
    })),
  };
}

// ── Candidate (6.2) ────────────────────────────────────────────────────────

export interface InterestedCompany {
  organizationName: string;
  roleTitle: string | null;
}

export interface CandidateDashboard {
  candidateId: string; // for building the public profile share link (Feature 1.3)
  completenessScore: number;
  interestedCount: number;
  interested: InterestedCompany[];
  savedPaths: number;
  openPaths: number;
  hasIntroVideo: boolean;
  hasAssessment: boolean;
}

export async function getCandidateDashboard(
  prisma: PrismaClient,
  userId: string,
): Promise<CandidateDashboard> {
  const [profile, interestedRows, savedPaths, openPaths] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.match.findMany({
      where: { candidateId: userId, status: { in: ['invited', 'connected'] } },
      orderBy: { updatedAt: 'desc' },
      include: { organization: true, role: true },
    }),
    prisma.pathSuggestion.count({ where: { candidateId: userId, status: 'saved' } }),
    prisma.pathSuggestion.count({ where: { candidateId: userId, status: 'suggested' } }),
  ]);

  const fit = (profile?.fitProfile ?? {}) as { personality?: Record<string, unknown> };

  return {
    candidateId: userId,
    completenessScore: profile?.completenessScore ?? 0,
    interestedCount: interestedRows.length,
    interested: interestedRows.map((m) => ({
      organizationName: m.organization.name,
      roleTitle: m.role?.title ?? null,
    })),
    savedPaths,
    openPaths,
    hasIntroVideo: Boolean(profile?.videoIntroUrl || profile?.videoIntroAssetId),
    hasAssessment: Boolean(fit.personality && Object.keys(fit.personality).length > 0),
  };
}
