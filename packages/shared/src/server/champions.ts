// The Champion On-Ramp (Epic 8, Feature 8.1) — SERVER ONLY.
//
// Counselors at TAP, VA, and USO are the highest-leverage on-ramp — every separating
// member passes through them. A champion gets an invite link (and a QR printed from it)
// for their office; members who come in through it are captured as leads referred by that
// champion, so the on-ramp's impact is measurable from day one. A champion is an
// Advocate(type: champion); their link is a ShareLink; arrivals are CaptureLeads.

import { createShareLink } from './advocacy';
import { type PrismaClient } from '../generated/prisma/client';

interface ChampionTracking {
  kind: 'champion';
  office: string | null;
}

export interface ChampionView {
  advocateId: string;
  email: string;
  officeName: string | null;
  code: string | null;
  referred: number;
}

/** Provision a champion + their trackable office link. */
export async function createChampion(
  prisma: PrismaClient,
  input: { email: string; officeName: string },
): Promise<ChampionView> {
  const advocate = await prisma.advocate.create({
    data: { email: input.email, type: 'champion', status: 'active' },
  });
  const { shortUrl } = await createShareLink(prisma, {
    advocateId: advocate.id,
    tracking: { kind: 'champion', office: input.officeName } satisfies ChampionTracking,
  });
  return {
    advocateId: advocate.id,
    email: advocate.email,
    officeName: input.officeName,
    code: shortUrl,
    referred: 0,
  };
}

export async function listChampions(prisma: PrismaClient): Promise<ChampionView[]> {
  const advocates = await prisma.advocate.findMany({
    where: { type: 'champion' },
    orderBy: { createdAt: 'desc' },
    include: { shareLinks: true, captureLeads: true },
  });
  return advocates.map((a) => {
    const link = a.shareLinks[0];
    const tracking = (link?.trackingParams ?? null) as unknown as ChampionTracking | null;
    return {
      advocateId: a.id,
      email: a.email,
      officeName: tracking?.office ?? null,
      code: link?.shortUrl ?? null,
      referred: a.captureLeads.length,
    };
  });
}

/** What the public champion landing shows — resolves the office, or null if unknown. */
export async function getChampionLanding(
  prisma: PrismaClient,
  code: string,
): Promise<{ office: string | null } | null> {
  const link = await prisma.shareLink.findUnique({
    where: { shortUrl: code },
    include: { advocate: true },
  });
  if (!link || link.advocate.type !== 'champion') return null;
  const tracking = (link.trackingParams ?? null) as unknown as ChampionTracking | null;
  return { office: tracking?.office ?? null };
}

/** A member opts in through a champion's link — captured BEFORE an account exists. */
export async function captureFromChampion(
  prisma: PrismaClient,
  input: { code: string; email?: string | null; phone?: string | null },
): Promise<{ ok: boolean }> {
  const link = await prisma.shareLink.findUnique({ where: { shortUrl: input.code } });
  if (!link) return { ok: false };

  await prisma.captureLead.create({
    data: {
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      source: 'champion',
      referredByAdvocate: link.advocateId,
    },
  });
  await prisma.attributionEvent.create({
    data: { shareLinkId: link.id, eventType: 'profile_created', subjectEmail: input.email?.trim() || null },
  });
  return { ok: true };
}
