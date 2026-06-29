// Hometown + Open To persistence (Feature 3.3 + relocation discoverability) — SERVER ONLY.
//
// Two DISTINCT fields, written here so they never drift:
//   • Hometown — ONE place the candidate is FROM. Stored on Profile.hometown, mirrored to
//     User.hometown (the long-standing search-indexed copy) and to a single primary Root
//     (kind: hometown) via the existing roots writer.
//   • Open To — MANY places they would relocate TO. Stored as a structured array on
//     Profile.openTo AND materialized as Root rows (kind: open_to) so company search is an
//     indexed query, filterable as hometown / open-to / either.
//
// A company can then find someone for a Milwaukee role whether Milwaukee is their hometown,
// somewhere they are open to, or both — see search.ts.

import { canonicalLocationLabel, normalizeOpenTo, type LocationRef } from '../location';
import { isDbConfigured } from './demo';
import { setRoots, listRoots, type RootView } from './roots';
import { logEvent } from './events';
import { Prisma, type PrismaClient } from '../generated/prisma/client';

export interface PlacesView {
  hometown: string | null;
  openTo: LocationRef[];
  /** The hometown ties behind "Come Home" (primary first). */
  roots: RootView[];
}

export interface SetPlacesInput {
  userId: string;
  /** Pass a string to set, '' or null to clear, or undefined to leave unchanged. */
  hometown?: string | null;
  /** Pass an array to replace the whole list, or undefined to leave unchanged. */
  openTo?: Array<LocationRef | string>;
}

function parseOpenTo(value: Prisma.JsonValue | null | undefined): LocationRef[] {
  if (!Array.isArray(value)) return [];
  return normalizeOpenTo(
    value.filter((v): v is Record<string, unknown> => !!v && typeof v === 'object').map((v) => ({
      label: String((v as { label?: unknown }).label ?? ''),
      kind: ((v as { kind?: unknown }).kind as LocationRef['kind']) ?? 'metro',
    })),
  );
}

export async function getPlaces(prisma: PrismaClient, userId: string): Promise<PlacesView> {
  if (!isDbConfigured()) return { hometown: null, openTo: [], roots: [] };
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) return { hometown: null, openTo: [], roots: [] };
  return {
    hometown: profile.hometown ?? null,
    openTo: parseOpenTo(profile.openTo),
    roots: await listRoots(prisma, userId),
  };
}

export async function setPlaces(prisma: PrismaClient, input: SetPlacesInput): Promise<PlacesView> {
  if (!isDbConfigured()) {
    return { hometown: input.hometown ?? null, openTo: normalizeOpenTo(input.openTo ?? []), roots: [] };
  }

  const profile = await prisma.profile.findUnique({ where: { userId: input.userId } });
  if (!profile) throw new Error(`No candidate profile for user ${input.userId}`);

  // ── Hometown: canonicalize, persist the single primary tie through the roots writer ──────
  if (input.hometown !== undefined) {
    const home = input.hometown ? canonicalLocationLabel(input.hometown) : null;
    // setRoots owns Profile.hometown + User.hometown + the primary hometown Root, and
    // preserves any additional hometown ties already on file.
    const existingTies = (await listRoots(prisma, input.userId)).filter((r) => !r.isPrimary);
    await setRoots(prisma, {
      userId: input.userId,
      roots: home
        ? [{ place: home, isPrimary: true }, ...existingTies.map((t) => ({ place: t.place, reason: t.reason }))]
        : existingTies.map((t) => ({ place: t.place, reason: t.reason })),
    });
  }

  // ── Open To: structured array on Profile + indexed kind:open_to Root rows ────────────────
  if (input.openTo !== undefined) {
    const openTo = normalizeOpenTo(input.openTo);
    await prisma.$transaction([
      prisma.profile.update({
        where: { id: profile.id },
        data: { openTo: openTo as unknown as Prisma.InputJsonValue, openToRelocate: openTo.length > 0 },
      }),
      prisma.root.deleteMany({ where: { profileId: profile.id, kind: 'open_to' } }),
      ...(openTo.length
        ? [
            prisma.root.createMany({
              data: openTo.map((l) => ({ profileId: profile.id, place: l.label, kind: 'open_to' as const })),
            }),
          ]
        : []),
    ]);
  }

  await logEvent(prisma, {
    actorId: input.userId,
    eventType: 'places_updated',
    targetId: profile.id,
    metadata: {
      setHometown: input.hometown !== undefined,
      openToCount: input.openTo !== undefined ? normalizeOpenTo(input.openTo).length : undefined,
    },
  });

  return getPlaces(prisma, input.userId);
}
