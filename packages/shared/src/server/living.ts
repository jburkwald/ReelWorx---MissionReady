// The Living Profile (Feature 1.6) — SERVER ONLY.
//
// Append-only, timestamped chapters stored on Profile.livingProfileChapters (a JSON array,
// no new column). New chapters newest-first. Keyless demo returns sample chapters so the
// experience walks with no DB.

import { randomUUID } from 'crypto';
import { isDbConfigured, demoLivingChapters } from './demo';
import { logEvent } from './events';
import type { LivingChapter } from '../profile/living';
import { Prisma, type PrismaClient } from '../generated/prisma/client';

function readChapters(raw: unknown): LivingChapter[] {
  return Array.isArray(raw) ? (raw as LivingChapter[]) : [];
}

export async function listLivingChapters(
  prisma: PrismaClient,
  userId: string,
): Promise<LivingChapter[]> {
  if (!isDbConfigured()) return demoLivingChapters();
  const profile = await prisma.profile.findUnique({ where: { userId } });
  return readChapters(profile?.livingProfileChapters);
}

export async function addLivingChapter(
  prisma: PrismaClient,
  input: { userId: string; title: string; body: string },
): Promise<LivingChapter[]> {
  const chapter: LivingChapter = {
    id: randomUUID(),
    title: input.title.trim(),
    body: input.body.trim(),
    at: new Date().toISOString(),
  };
  if (!chapter.title && !chapter.body) {
    return listLivingChapters(prisma, input.userId);
  }

  if (!isDbConfigured()) return [chapter, ...demoLivingChapters()];

  const profile = await prisma.profile.findUnique({ where: { userId: input.userId } });
  if (!profile) throw new Error(`No candidate profile for user ${input.userId}`);

  const next = [chapter, ...readChapters(profile.livingProfileChapters)];
  await prisma.profile.update({
    where: { id: profile.id },
    data: { livingProfileChapters: next as unknown as Prisma.InputJsonValue },
  });
  await logEvent(prisma, {
    actorId: input.userId,
    eventType: 'living_chapter_added',
    targetId: profile.id,
    metadata: { title: chapter.title },
  });
  return next;
}
