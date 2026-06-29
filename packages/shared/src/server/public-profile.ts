// One Profile, Two Outputs (Epic 1, Feature 1.3) — SERVER ONLY.
//
// The same profile renders two ways: the rich human version (story, intro video, decoded
// credibility — shareable by one link, sendable anywhere) and the clean single-column ATS
// version (no media, parseable when uploaded off-platform). Same data, two renderings — so
// a counselor can tell a member "your MissionReady profile IS your new résumé."
//
// Visibility-aware: a `private` profile never renders publicly. `public` and
// `companies_only` both render via a direct link — sharing the link is the candidate's own
// deliberate act (an unlisted story they chose to send), which is the whole point of 1.3.

import type { DecodedCredibility } from '../types/credibility';
import { type PrismaClient } from '../generated/prisma/client';

export interface PublicProfile {
  candidateId: string;
  handle: string;
  headline: string | null;
  currentLocation: string | null;
  hometown: string | null;
  introPosterUrl: string | null;
  introStreamUrl: string | null;
  decoded: DecodedCredibility | null;
  skills: string[];
  civilianEquivalents: string[];
  values: string[];
  whyEachMove: { role: string; why: string }[];
  roots: { place: string; isPrimary: boolean }[];
  exploringPaths: string[];
  completenessScore: number;
}

// Our stored intro URL is the Mux HLS manifest; pull the playback id back out of it to
// build a poster image that renders everywhere (HLS itself only plays natively in Safari).
function extractPlaybackId(hlsUrl: string | null): string | null {
  if (!hlsUrl) return null;
  const m = hlsUrl.match(/stream\.mux\.com\/([^./]+)\.m3u8/);
  return m?.[1] ?? null;
}

export async function getPublicProfile(
  prisma: PrismaClient,
  candidateId: string,
): Promise<PublicProfile | null> {
  const profile = await prisma.profile.findUnique({
    where: { userId: candidateId },
    include: { user: true, roots: true },
  });
  if (!profile || profile.visibility === 'private') return null;

  const fit = (profile.fitProfile ?? {}) as {
    skillsExperience?: { translatedSkills?: string[]; civilianEquivalents?: string[] };
    motivationValues?: { coreValues?: string[] };
  };
  const playbackId = extractPlaybackId(profile.videoIntroUrl);

  const saved = await prisma.pathSuggestion.findMany({
    where: { candidateId, status: 'saved' },
    orderBy: { fitScore: 'desc' },
    select: { title: true },
  });

  return {
    candidateId,
    handle: profile.user.email.split('@')[0],
    headline: profile.headline,
    currentLocation: profile.user.currentLocation,
    hometown: profile.user.hometown,
    introPosterUrl: playbackId ? `https://image.mux.com/${playbackId}/thumbnail.png?width=1200` : null,
    introStreamUrl: profile.videoIntroUrl,
    decoded: (profile.decodedCredibility ?? null) as DecodedCredibility | null,
    skills: fit.skillsExperience?.translatedSkills ?? [],
    civilianEquivalents: fit.skillsExperience?.civilianEquivalents ?? [],
    values: fit.motivationValues?.coreValues ?? [],
    whyEachMove: Array.isArray(profile.whyEachMove)
      ? (profile.whyEachMove as { role: string; why: string }[])
      : [],
    roots: profile.roots
      .slice()
      .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))
      .map((r) => ({ place: r.place, isPrimary: r.isPrimary })),
    exploringPaths: saved.map((s) => s.title),
    completenessScore: profile.completenessScore,
  };
}
