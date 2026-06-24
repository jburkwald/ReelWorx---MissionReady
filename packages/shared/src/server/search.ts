// People Search — "Come Home" (Epic 3, Feature 3.3) — SERVER ONLY.
//
// Karen searches the candidate pool by keyword and/or hometown roots to bring talent back
// to her region. Strategic and genuinely easy: a place filter rides the indexed Root table
// (plus the candidate's current location), and a keyword scans the human-readable fields
// (headline + the decoded business summary). Respects visibility — never surfaces a
// candidate who chose `private`.

import { type PrismaClient, type Prisma } from '../generated/prisma/client';

export interface PeopleSearchResult {
  candidateId: string;
  displayName: string;
  headline: string | null;
  currentLocation: string | null;
  roots: { place: string; isPrimary: boolean }[];
  decodedSummary: string | null;
  completenessScore: number;
}

export interface SearchCandidatesInput {
  query?: string | null;
  place?: string | null;
  limit?: number;
}

export async function searchCandidates(
  prisma: PrismaClient,
  input: SearchCandidatesInput,
): Promise<PeopleSearchResult[]> {
  const query = input.query?.trim();
  const place = input.place?.trim();

  const and: Prisma.ProfileWhereInput[] = [];
  if (query) {
    and.push({
      OR: [
        { headline: { contains: query, mode: 'insensitive' } },
        { mosTranslation: { contains: query, mode: 'insensitive' } },
      ],
    });
  }
  if (place) {
    and.push({
      OR: [
        { roots: { some: { place: { contains: place, mode: 'insensitive' } } } },
        { user: { hometown: { contains: place, mode: 'insensitive' } } },
        { user: { currentLocation: { contains: place, mode: 'insensitive' } } },
      ],
    });
  }

  const profiles = await prisma.profile.findMany({
    where: {
      visibility: { in: ['public', 'companies_only'] },
      ...(and.length ? { AND: and } : {}),
    },
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
      .slice()
      .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))
      .map((r) => ({ place: r.place, isPrimary: r.isPrimary })),
    decodedSummary: p.mosTranslation,
    completenessScore: p.completenessScore,
  }));
}
