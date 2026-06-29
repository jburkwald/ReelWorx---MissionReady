// Roots — "Come Home" ties (Epic 3, Feature 3.3) — SERVER ONLY.
//
// A candidate keeps a Roots list: one or more places they have ties to, with exactly one
// primary hometown. Normalized into the indexed Root table so hometown search is a real
// query, not a JSON scan (Marcus: "companies from my hometown find me"). The primary root
// is mirrored to User.hometown so the rest of the app's hometown-aware surfaces stay
// consistent with what the candidate curated here.

import { type PrismaClient } from '../generated/prisma/client';

export interface RootInput {
  place: string;
  isPrimary?: boolean;
  reason?: string | null;
}

export interface RootView {
  id: string;
  place: string;
  isPrimary: boolean;
  reason: string | null;
}

const normalizePlace = (s: string) => s.trim().replace(/\s+/g, ' ');

export async function listRoots(prisma: PrismaClient, userId: string): Promise<RootView[]> {
  const rows = await prisma.root.findMany({
    // Roots are the "Come Home" hometown ties only; Open To places (kind: open_to) are a
    // separate field managed by places.ts and must not leak into this list.
    where: { profile: { userId }, kind: 'hometown' },
    orderBy: [{ isPrimary: 'desc' }, { place: 'asc' }],
  });
  return rows.map((r) => ({ id: r.id, place: r.place, isPrimary: r.isPrimary, reason: r.reason }));
}

/**
 * Replace the candidate's whole Roots list (the mobile editor sends the full set). Cleans
 * + dedupes places, guarantees exactly one primary, and syncs User.hometown to it. Done in
 * one transaction so search never sees a half-written set.
 */
export async function setRoots(
  prisma: PrismaClient,
  input: { userId: string; roots: RootInput[] },
): Promise<RootView[]> {
  const profile = await prisma.profile.findUnique({ where: { userId: input.userId } });
  if (!profile) throw new Error(`No candidate profile for user ${input.userId}`);

  // Normalize, drop blanks, dedupe by place (case-insensitive).
  const seen = new Set<string>();
  const cleaned: Required<RootInput>[] = [];
  for (const r of input.roots) {
    const place = normalizePlace(r.place ?? '');
    if (!place) continue;
    const key = place.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push({ place, isPrimary: Boolean(r.isPrimary), reason: r.reason?.trim() || null });
  }

  // Exactly one primary: honor the first flagged, else default to the first entry.
  let primaryIdx = cleaned.findIndex((r) => r.isPrimary);
  if (primaryIdx === -1 && cleaned.length > 0) primaryIdx = 0;
  cleaned.forEach((r, i) => {
    r.isPrimary = i === primaryIdx;
  });

  const primaryPlace = primaryIdx >= 0 ? cleaned[primaryIdx].place : null;
  await prisma.$transaction([
    // Only replace the hometown-kind rows; Open To rows (kind: open_to) are untouched.
    prisma.root.deleteMany({ where: { profileId: profile.id, kind: 'hometown' } }),
    ...(cleaned.length
      ? [
          prisma.root.createMany({
            data: cleaned.map((r) => ({
              profileId: profile.id,
              place: r.place,
              kind: 'hometown' as const,
              isPrimary: r.isPrimary,
              reason: r.reason,
            })),
          }),
        ]
      : []),
    // Mirror the primary hometown onto both User (search-indexed) and Profile (display copy).
    prisma.user.update({ where: { id: input.userId }, data: { hometown: primaryPlace } }),
    prisma.profile.update({ where: { id: profile.id }, data: { hometown: primaryPlace } }),
  ]);

  return listRoots(prisma, input.userId);
}
