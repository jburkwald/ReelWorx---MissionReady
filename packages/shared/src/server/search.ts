// People Search — "Come Home" (Epic 3, Feature 3.3) — SERVER ONLY.
//
// Karen searches the candidate pool by keyword and/or hometown roots to bring talent back
// to her region. Strategic and genuinely easy: a place filter rides the indexed Root table
// (plus the candidate's current location), and a keyword scans the human-readable fields
// (headline + the decoded business summary). Respects visibility — never surfaces a
// candidate who chose `private`.

import { isDbConfigured, demoPeople } from './demo';
import { type PrismaClient, type Prisma } from '../generated/prisma/client';

export interface PeopleSearchResult {
  candidateId: string;
  displayName: string;
  headline: string | null;
  currentLocation: string | null;
  roots: { place: string; isPrimary: boolean }[];
  /** Places the candidate is open to relocating to (Open To), for the "would move here" badge. */
  openTo: string[];
  decodedSummary: string | null;
  completenessScore: number;
}

/**
 * Where a place filter looks. 'hometown' = people FROM here (Come Home), 'open_to' = people
 * who would relocate HERE, 'either' (default) = both. Karen sourcing a Milwaukee role can ask
 * for roots, relocation-willing, or anyone connected to Milwaukee at all.
 */
export type PlaceScope = 'hometown' | 'open_to' | 'either';

export interface SearchCandidatesInput {
  query?: string | null;
  place?: string | null;
  placeScope?: PlaceScope;
  limit?: number;
}

// Shared where-builder so search and the "new since" count never drift apart. Always
// scoped to candidates discoverable to companies (never `private`).
function candidateWhere(
  query?: string | null,
  place?: string | null,
  placeScope: PlaceScope = 'either',
): Prisma.ProfileWhereInput {
  const q = query?.trim();
  const p = place?.trim();
  const and: Prisma.ProfileWhereInput[] = [];
  if (q) {
    and.push({
      OR: [
        { headline: { contains: q, mode: 'insensitive' } },
        { mosTranslation: { contains: q, mode: 'insensitive' } },
      ],
    });
  }
  if (p) {
    const contains = { contains: p, mode: 'insensitive' as const };
    const hometownMatch: Prisma.ProfileWhereInput[] = [
      { roots: { some: { kind: 'hometown', place: contains } } },
      { hometown: contains },
      { user: { hometown: contains } },
      { user: { currentLocation: contains } },
    ];
    const openToMatch: Prisma.ProfileWhereInput[] = [
      { roots: { some: { kind: 'open_to', place: contains } } },
    ];
    const or =
      placeScope === 'hometown'
        ? hometownMatch
        : placeScope === 'open_to'
          ? openToMatch
          : [...hometownMatch, ...openToMatch];
    and.push({ OR: or });
  }
  return {
    visibility: { in: ['public', 'companies_only'] },
    ...(and.length ? { AND: and } : {}),
  };
}

export async function searchCandidates(
  prisma: PrismaClient,
  input: SearchCandidatesInput,
): Promise<PeopleSearchResult[]> {
  if (!isDbConfigured()) return demoPeople({ query: input.query, place: input.place });

  const profiles = await prisma.profile.findMany({
    where: candidateWhere(input.query, input.place, input.placeScope),
    include: { user: true, roots: true },
    orderBy: { completenessScore: 'desc' },
    take: input.limit ?? 25,
  });

  return profiles.map((p) => ({
    candidateId: p.user.id,
    displayName: p.user.email.split('@')[0],
    headline: p.headline,
    currentLocation: p.user.currentLocation,
    roots: p.roots
      .filter((r) => r.kind === 'hometown')
      .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))
      .map((r) => ({ place: r.place, isPrimary: r.isPrimary })),
    openTo: p.roots.filter((r) => r.kind === 'open_to').map((r) => r.place),
    decodedSummary: p.mosTranslation,
    completenessScore: p.completenessScore,
  }));
}

/** Count discoverable candidates matching the criteria who appeared since a timestamp —
 *  the "N new since you last looked" behind a saved alert (Feature 3.4). */
export function countNewCandidates(
  prisma: PrismaClient,
  input: { query?: string | null; place?: string | null; placeScope?: PlaceScope; since: Date },
): Promise<number> {
  return prisma.profile.count({
    where: {
      ...candidateWhere(input.query, input.place, input.placeScope),
      createdAt: { gte: input.since },
    },
  });
}
