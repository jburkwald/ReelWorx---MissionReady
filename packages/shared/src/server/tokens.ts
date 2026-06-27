// Tokens — the signal layer (Epic 3, Features 3.1/3.2) — SERVER ONLY.
//
// Intent is scarce BY DESIGN: exploration is free, but reaching out costs a token, so when
// it happens it means something (Layer 3 of the architecture — "Volume is the enemy of
// signal"). A company gets a monthly invite allotment; spending one is a deliberate act.
// Source distinguishes granted vs purchased so the revenue line is queryable from day one
// (purchased top-ups via Stripe are deferred — the schema already holds `stripeRef`).

import { isDbConfigured, DEMO_INVITE_BALANCE } from './demo';
import { type PrismaClient } from '../generated/prisma/client';

// Karen wants "ten to fifteen a week" — a monthly allotment in that spirit, deliberately
// finite so sourcing stays high-intent. A single number, easy to tune as we learn.
export const MONTHLY_INVITE_ALLOTMENT = 20;

function startOfMonthUTC(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/**
 * Idempotently grant this month's invite allotment to an organization. Safe to call on
 * every load — it grants once per calendar month (keyed on a monthly_grant token already
 * existing this month), then never again until the month rolls over.
 */
export async function ensureMonthlyInviteTokens(
  prisma: PrismaClient,
  organizationId: string,
): Promise<void> {
  const grantedThisMonth = await prisma.token.count({
    where: {
      organizationId,
      type: 'invite',
      source: 'monthly_grant',
      createdAt: { gte: startOfMonthUTC() },
    },
  });
  if (grantedThisMonth > 0) return;

  await prisma.token.createMany({
    data: Array.from({ length: MONTHLY_INVITE_ALLOTMENT }, () => ({
      organizationId,
      type: 'invite' as const,
      source: 'monthly_grant' as const,
    })),
  });
}

/** Count an organization's spendable invite tokens. */
export function getInviteBalance(prisma: PrismaClient, organizationId: string): Promise<number> {
  return prisma.token.count({
    where: { organizationId, type: 'invite', status: 'active' },
  });
}

/** Ensure the allotment exists, then report the current balance — what the UI shows. */
export async function getReadyInviteBalance(
  prisma: PrismaClient,
  organizationId: string,
): Promise<number> {
  if (!isDbConfigured()) return DEMO_INVITE_BALANCE;
  await ensureMonthlyInviteTokens(prisma, organizationId);
  return getInviteBalance(prisma, organizationId);
}

/**
 * Spend one active invite token, marking what it was spent on. Returns false if none are
 * available (caller surfaces "out of tokens"). MVP-grade concurrency: pick one active
 * token then mark it spent; good enough until a real top-up flow makes contention matter.
 */
export async function spendInviteToken(
  prisma: PrismaClient,
  organizationId: string,
  spentOn: string,
): Promise<boolean> {
  const token = await prisma.token.findFirst({
    where: { organizationId, type: 'invite', status: 'active' },
    orderBy: [{ expiresAt: 'asc' }, { createdAt: 'asc' }], // spend soonest-expiring first
  });
  if (!token) return false;

  await prisma.token.update({
    where: { id: token.id },
    data: { status: 'spent', spentOn },
  });
  return true;
}
