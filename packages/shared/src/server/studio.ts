// Self-Serve Story Studio (Feature 5.1) — SERVER ONLY.
//
// Karen assembles a story Reel from a locked theme + her own footage or site URL, with no
// partner in the loop. Assembly is the spine; the only generated piece is the hook/caption
// (the variable slot the theme frames), and even that has a deterministic fallback so the
// studio is reliable at launch. The brand stays the creative director — we never generate
// the whole thing.

import Anthropic from '@anthropic-ai/sdk';
import { getAnthropic, MODELS } from './ai';
import { getStoryTheme } from '../studio/themes';
import { logEvent } from './events';
import { type PrismaClient } from '../generated/prisma/client';

async function generateHook(input: {
  themeName: string;
  themeTagline: string;
  title: string;
  sourceUrl?: string | null;
}): Promise<string> {
  const fallback = input.title;
  try {
    const client = getAnthropic();
    const res = await client.messages.create({
      model: MODELS.fast, // a one-line caption is exactly the cheap, high-volume slot
      max_tokens: 200,
      system:
        'You write a single short, human hook (max ~18 words) for a company story Reel. ' +
        'Warm and specific, never corporate filler or hashtags. Output only the hook text.',
      messages: [
        {
          role: 'user',
          content: [
            `Theme: ${input.themeName} — ${input.themeTagline}`,
            `Reel title: ${input.title}`,
            input.sourceUrl ? `Reference: ${input.sourceUrl}` : null,
          ]
            .filter(Boolean)
            .join('\n'),
        },
      ],
    });
    const text = res.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text;
    return text?.trim() || fallback;
  } catch {
    return fallback; // studio stays reliable even without the AI key
  }
}

export interface CreateStudioReelInput {
  organizationId: string;
  actorUserId: string;
  themeId: string;
  title: string;
  videoUrl?: string | null;
  sourceUrl?: string | null;
}

export async function createStudioReel(prisma: PrismaClient, input: CreateStudioReelInput) {
  const theme = getStoryTheme(input.themeId);
  if (!theme) throw new Error(`Unknown studio theme: ${input.themeId}`);

  const caption = await generateHook({
    themeName: theme.name,
    themeTagline: theme.tagline,
    title: input.title,
    sourceUrl: input.sourceUrl,
  });

  const reel = await prisma.reel.create({
    data: {
      type: 'culture', // a company story (job-attached Reels come from createRole)
      organizationId: input.organizationId,
      themeId: input.themeId,
      title: input.title,
      caption,
      videoUrl: input.videoUrl ?? null,
    },
  });

  await logEvent(prisma, {
    actorId: input.actorUserId,
    eventType: 'studio_reel_created',
    targetId: reel.id,
    metadata: { themeId: input.themeId, hasVideo: Boolean(input.videoUrl) },
  });

  return reel;
}

export interface StudioReelView {
  id: string;
  themeId: string | null;
  title: string | null;
  caption: string | null;
  videoUrl: string | null;
  createdAt: string;
}

/** The org's studio-made Reels (themeId distinguishes them from role-attached job Reels). */
export async function listStudioReels(
  prisma: PrismaClient,
  organizationId: string,
): Promise<StudioReelView[]> {
  const reels = await prisma.reel.findMany({
    where: { organizationId, themeId: { not: null } },
    orderBy: { createdAt: 'desc' },
  });
  return reels.map((r) => ({
    id: r.id,
    themeId: r.themeId,
    title: r.title,
    caption: r.caption,
    videoUrl: r.videoUrl,
    createdAt: r.createdAt.toISOString(),
  }));
}
