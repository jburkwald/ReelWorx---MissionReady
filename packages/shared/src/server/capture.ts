// Owned Capture & Digest (Epic 8, Feature 8.2) — SERVER ONLY.
//
// The reliable base that doesn't depend on any partner: a member opts in by email or text
// at the transition point (captured BEFORE an account exists), and gets a steady, relevant
// drumbeat of opportunities — especially hometown ones. The opt-in and the digest CONTENT
// are owned infrastructure built now; the weekly send needs an email/SMS provider and is
// the one deferred piece (the content builder is ready for it).

import { type PrismaClient } from '../generated/prisma/client';

/** General owned opt-in (vs. the champion-attributed capture in champions.ts). */
export async function captureOwnedLead(
  prisma: PrismaClient,
  input: { email?: string | null; phone?: string | null },
): Promise<{ ok: boolean }> {
  const email = input.email?.trim() || null;
  const phone = input.phone?.trim() || null;
  if (!email && !phone) return { ok: false };

  await prisma.captureLead.create({
    data: { email, phone, source: 'owned' },
  });
  return { ok: true };
}

export interface DigestItem {
  roleTitle: string;
  organizationName: string;
  location: string | null;
}

/**
 * The content a weekly digest would carry: recent open opportunities, optionally weighted
 * to a place (hometown). Pure read — reused by the opt-in preview now and the scheduled
 * send later, so the member always sees the same "drumbeat" the email will deliver.
 */
export async function buildDigest(
  prisma: PrismaClient,
  input: { place?: string | null; limit?: number } = {},
): Promise<DigestItem[]> {
  const place = input.place?.trim();
  const roles = await prisma.role.findMany({
    where: place ? { location: { contains: place, mode: 'insensitive' } } : {},
    orderBy: { createdAt: 'desc' },
    take: input.limit ?? 8,
    include: { organization: true },
  });
  return roles.map((r) => ({
    roleTitle: r.title,
    organizationName: r.organization.name,
    location: r.location,
  }));
}
