// Intentful Reach (Epic 3, Features 3.1/3.2) — SERVER ONLY.
//
// The moment a company commits: it spends an invite token to reach out on a specific
// match. That single deliberate act flips the match to `invited`, and — just as important
// — it creates the notification that lets Dana feel *wanted* ("a company recruits me, so I
// feel wanted instead of overlooked"). Being pursued is the emotional core of this feature,
// so the reach-out and the candidate-facing signal are built together, not bolted on later.

import { EVENT_TYPES, logEvent } from './events';
import {
  ensureMonthlyInviteTokens,
  getInviteBalance,
  spendInviteToken,
} from './tokens';
import { type PrismaClient } from '../generated/prisma/client';

export type ReachOutStatus = 'invited' | 'already' | 'no_tokens' | 'error';

export interface ReachOutResult {
  status: ReachOutStatus;
  balance: number;
}

/**
 * Company reaches out to a candidate on a match. Idempotent for an already-invited match
 * (never double-spends). Returns `no_tokens` rather than throwing so the UI can surface it
 * gently. The spend, the status change, the notification, and the events all happen here.
 */
export async function reachOutToCandidate(
  prisma: PrismaClient,
  input: { organizationId: string; actorUserId: string; matchId: string },
): Promise<ReachOutResult> {
  const match = await prisma.match.findUnique({
    where: { id: input.matchId },
    include: { role: true, organization: true },
  });
  if (!match || match.organizationId !== input.organizationId) {
    return { status: 'error', balance: 0 };
  }

  // Already pursued — don't spend again.
  if (match.status === 'invited' || match.status === 'connected') {
    return { status: 'already', balance: await getInviteBalance(prisma, input.organizationId) };
  }

  await ensureMonthlyInviteTokens(prisma, input.organizationId);
  const spent = await spendInviteToken(prisma, input.organizationId, match.id);
  if (!spent) {
    return { status: 'no_tokens', balance: 0 };
  }

  await prisma.match.update({ where: { id: match.id }, data: { status: 'invited' } });

  // Dana's moment: a clear, warm signal that a company chose to reach out to HER.
  await prisma.notification.create({
    data: {
      userId: match.candidateId,
      type: 'invite',
      channel: 'push',
      payload: {
        matchId: match.id,
        organizationId: match.organizationId,
        organizationName: match.organization.name,
        roleId: match.roleId,
        roleTitle: match.role?.title ?? null,
      },
    },
  });

  await logEvent(prisma, {
    actorId: input.actorUserId,
    eventType: EVENT_TYPES.reachOutSent,
    targetId: match.candidateId,
    metadata: { matchId: match.id, roleId: match.roleId },
  });
  await logEvent(prisma, {
    actorId: input.actorUserId,
    eventType: EVENT_TYPES.tokenSpent,
    targetId: match.id,
    metadata: { type: 'invite' },
  });

  return { status: 'invited', balance: await getInviteBalance(prisma, input.organizationId) };
}

/** One invitation as the candidate sees it (mobile "someone wants to connect"). */
export interface InviteView {
  matchId: string;
  organizationName: string;
  roleTitle: string | null;
  createdAt: string;
}

/** The candidate's open invitations — companies that have reached out to them. */
export async function listInvitesForCandidate(
  prisma: PrismaClient,
  userId: string,
): Promise<InviteView[]> {
  const matches = await prisma.match.findMany({
    where: { candidateId: userId, status: { in: ['invited', 'connected'] } },
    orderBy: { updatedAt: 'desc' },
    include: { organization: true, role: true },
  });
  return matches.map((m) => ({
    matchId: m.id,
    organizationName: m.organization.name,
    roleTitle: m.role?.title ?? null,
    createdAt: m.updatedAt.toISOString(),
  }));
}
