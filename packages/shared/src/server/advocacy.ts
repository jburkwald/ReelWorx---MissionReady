// Advocacy + attribution (Epic 4, Features 4.1/4.2) — SERVER ONLY.
//
// "The people who served keep serving by pulling the next ones through." A placed veteran
// shares in one tap with a trackable link, and every hire can be traced back to who drove
// it. Tracking ships in the MVP precisely to VALIDATE who creates hires before any payout
// is built (Feature 4.3 is deliberately gated on this data). The motivation is service —
// the impact stat shows a veteran they're helping, never a commission.

import { type PrismaClient } from '../generated/prisma/client';

function slug(): string {
  return globalThis.crypto.randomUUID().replace(/-/g, '').slice(0, 10);
}

/** Get-or-create the Advocate record for a candidate who wants to serve forward. */
export async function ensureAdvocateForUser(
  prisma: PrismaClient,
  input: { userId: string; email: string },
) {
  const existing = await prisma.advocate.findUnique({ where: { userId: input.userId } });
  if (existing) return existing;
  return prisma.advocate.create({
    data: { userId: input.userId, email: input.email, type: 'veteran_advocate' },
  });
}

export interface CreateShareLinkInput {
  advocateId: string;
  organizationId?: string | null;
  reelId?: string | null;
  tracking?: Record<string, unknown>;
}

/** Mint a trackable short link. The full URL is built by the caller from its own origin. */
export async function createShareLink(
  prisma: PrismaClient,
  input: CreateShareLinkInput,
): Promise<{ shortUrl: string }> {
  const shortUrl = slug();
  await prisma.shareLink.create({
    data: {
      advocateId: input.advocateId,
      organizationId: input.organizationId ?? null,
      reelId: input.reelId ?? null,
      shortUrl,
      ...(input.tracking ? { trackingParams: input.tracking as object } : {}),
    },
  });
  return { shortUrl };
}

/**
 * Log a visit to a share link (the click that starts the attribution chain). Returns the
 * link (with its advocate/org) so the redirect target can be resolved, or null if unknown.
 */
export async function recordShareClick(
  prisma: PrismaClient,
  shortUrl: string,
  subjectEmail?: string | null,
) {
  const link = await prisma.shareLink.findUnique({
    where: { shortUrl },
    include: { organization: true },
  });
  if (!link) return null;
  await prisma.attributionEvent.create({
    data: { shareLinkId: link.id, eventType: 'click', subjectEmail: subjectEmail ?? null },
  });
  return link;
}

export interface AdvocateImpact {
  shares: number;
  clicks: number;
}

/** What a veteran sees about the good they've done — visits driven, not dollars. */
export async function getAdvocateImpact(
  prisma: PrismaClient,
  userId: string,
): Promise<AdvocateImpact> {
  const advocate = await prisma.advocate.findUnique({
    where: { userId },
    include: { shareLinks: { select: { id: true } } },
  });
  if (!advocate) return { shares: 0, clicks: 0 };
  const linkIds = advocate.shareLinks.map((l) => l.id);
  const clicks = linkIds.length
    ? await prisma.attributionEvent.count({
        where: { shareLinkId: { in: linkIds }, eventType: 'click' },
      })
    : 0;
  return { shares: advocate.shareLinks.length, clicks };
}
