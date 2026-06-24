// Path Discovery (Epic 2, Feature 2.1 — the hero feature) — SERVER ONLY.
//
// For Marcus, who doesn't yet know who he becomes next, the platform leads with paths he
// may never have pictured. The engine looks PAST the literal civilian equivalent of a
// job to who the person actually is — personality, drive, how they work with people — and
// suggests grounded but non-obvious directions across civilian sectors, each with its
// reasoning shown at a moderate level. A "no" is not discarded: it's fed back in, so the
// next suggestion is sharper ("Data is the flywheel" — every rejection is a signal).

import Anthropic from '@anthropic-ai/sdk';
import { getAnthropic, MODELS } from './ai';
import { EVENT_TYPES, logEvent } from './events';
import type { DecodedCredibility } from '../types/credibility';
import { type PrismaClient } from '../generated/prisma/client';

export type PathDecision = 'saved' | 'rejected';

/** Serializable view of one suggested path for the candidate surface. */
export interface PathView {
  id: string;
  pathKey: string;
  title: string;
  reasoning: string | null;
  fitScore: number | null;
  status: 'suggested' | 'saved';
}

interface DiscoverInput {
  headline?: string | null;
  fitProfile: unknown;
  whyEachMove: { role: string; why: string }[];
  decoded?: DecodedCredibility | null;
  hometown?: string | null;
  avoidPathKeys: string[];
  rejectedTitles: string[];
  savedTitles: string[];
  count: number;
}

interface RawPath {
  pathKey: string;
  title: string;
  reasoning: string;
  fitScore: number;
}

const suggestTool: Anthropic.Tool = {
  name: 'suggest_paths',
  description: 'Propose career paths for this person, each with a stable key, a title, the reasoning, and a 0-100 fit.',
  input_schema: {
    type: 'object',
    properties: {
      paths: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            pathKey: {
              type: 'string',
              description: 'Stable kebab-case slug for the path, e.g. "industrial-operations-manager".',
            },
            title: { type: 'string', description: 'The path / role name, plus its sector if it helps.' },
            reasoning: {
              type: 'string',
              description:
                '2-3 sentences at a moderate level: why THIS person, grounded in who they are ' +
                '("because you…"). Concrete, honest, never generic.',
            },
            fitScore: { type: 'number', description: '0-100 fit for this person.' },
          },
          required: ['pathKey', 'title', 'reasoning', 'fitScore'],
          additionalProperties: false,
        },
      },
    },
    required: ['paths'],
    additionalProperties: false,
  },
};

const SYSTEM = `You are a career-path discovery engine for transitioning service members. Your job is to surface directions the person may NEVER have pictured — not the obvious civilian translation of their military job.

Look past the role to the human: personality, what drives them, how they work with people, what they value. The classic win is lateral and surprising but grounded — a diesel mechanic who loves people and wants to protect them discovering sales, or recruiting, or training. Vary the civilian sectors across your suggestions; don't cluster them all in one industry.

For each path: a stable kebab-case pathKey, a clear title, 2-3 sentences of honest reasoning at a moderate level ("because you…"), and a realistic 0-100 fit. Never repeat a path the person has already been shown. If they rejected paths, learn from it and move away from that direction. Call suggest_paths exactly once.`;

async function discoverPaths(input: DiscoverInput): Promise<RawPath[]> {
  const client = getAnthropic();
  const userText = [
    `Suggest ${input.count} new career paths for this person.`,
    input.headline ? `\nHeadline: ${input.headline}` : null,
    input.decoded ? `\nDecoded read: ${input.decoded.businessSummary}` : null,
    input.hometown ? `\nRoots: ${input.hometown}` : null,
    `\nFull Spectrum profile (JSON): ${JSON.stringify(input.fitProfile)}`,
    input.whyEachMove.length
      ? `\nThe why behind their moves:\n${input.whyEachMove.map((w) => `- ${w.role}: ${w.why}`).join('\n')}`
      : null,
    input.savedTitles.length ? `\nPaths they SAVED (lean toward this energy): ${input.savedTitles.join(', ')}` : null,
    input.rejectedTitles.length
      ? `\nPaths they REJECTED (move away from these): ${input.rejectedTitles.join(', ')}`
      : null,
    input.avoidPathKeys.length ? `\nAlready shown — do NOT repeat these keys: ${input.avoidPathKeys.join(', ')}` : null,
  ]
    .filter((l): l is string => l !== null)
    .join('');

  const res = await client.messages.create({
    model: MODELS.narration,
    max_tokens: 1536,
    system: SYSTEM,
    tools: [suggestTool],
    tool_choice: { type: 'tool', name: 'suggest_paths' },
    messages: [{ role: 'user', content: userText }],
  });

  for (const block of res.content) {
    if (block.type === 'tool_use' && block.name === 'suggest_paths') {
      const out = block.input as { paths?: RawPath[] };
      return Array.isArray(out.paths) ? out.paths : [];
    }
  }
  return [];
}

const toView = (p: {
  id: string;
  pathKey: string;
  title: string;
  reasoning: string | null;
  fitScore: number | null;
  status: string;
}): PathView => ({
  id: p.id,
  pathKey: p.pathKey,
  title: p.title,
  reasoning: p.reasoning,
  fitScore: p.fitScore === null ? null : Math.round(p.fitScore),
  status: p.status === 'saved' ? 'saved' : 'suggested',
});

/** Current live paths for the candidate: saved first (kept), then open suggestions. */
export async function listPathSuggestions(
  prisma: PrismaClient,
  userId: string,
): Promise<PathView[]> {
  const rows = await prisma.pathSuggestion.findMany({
    where: { candidateId: userId, status: { in: ['suggested', 'saved'] } },
    orderBy: [{ status: 'asc' }, { fitScore: 'desc' }],
  });
  return rows.map(toView);
}

/**
 * Generate fresh suggestions, informed by what the person has already seen, saved, and
 * rejected. Deduplicates against every path they've ever been shown. Returns the full
 * current list. Degrades gracefully: if the AI is unavailable, returns the existing list.
 */
export async function generatePathSuggestions(
  prisma: PrismaClient,
  input: { userId: string; count?: number },
): Promise<PathView[]> {
  const count = input.count ?? 4;
  const profile = await prisma.profile.findUnique({ where: { userId: input.userId } });

  const history = await prisma.pathSuggestion.findMany({ where: { candidateId: input.userId } });
  const avoidPathKeys = history.map((h) => h.pathKey);
  const rejectedTitles = history.filter((h) => h.status === 'rejected').map((h) => h.title);
  const savedTitles = history.filter((h) => h.status === 'saved').map((h) => h.title);

  let raw: RawPath[] = [];
  try {
    raw = await discoverPaths({
      headline: profile?.headline,
      fitProfile: profile?.fitProfile ?? {},
      whyEachMove: Array.isArray(profile?.whyEachMove)
        ? (profile?.whyEachMove as { role: string; why: string }[])
        : [],
      decoded: (profile?.decodedCredibility ?? null) as DecodedCredibility | null,
      hometown: null,
      avoidPathKeys,
      rejectedTitles,
      savedTitles,
      count,
    });
  } catch {
    return listPathSuggestions(prisma, input.userId); // AI unavailable — return what exists
  }

  // Persist only genuinely new paths (dedupe on pathKey across the person's whole history).
  const seen = new Set(avoidPathKeys);
  for (const p of raw) {
    if (!p.pathKey || seen.has(p.pathKey)) continue;
    seen.add(p.pathKey);
    await prisma.pathSuggestion.create({
      data: {
        candidateId: input.userId,
        pathKey: p.pathKey,
        title: p.title,
        reasoning: p.reasoning,
        fitScore: typeof p.fitScore === 'number' ? p.fitScore : null,
      },
    });
    await logEvent(prisma, {
      actorId: input.userId,
      eventType: EVENT_TYPES.pathSuggested,
      metadata: { pathKey: p.pathKey, title: p.title },
    });
  }

  return listPathSuggestions(prisma, input.userId);
}

/**
 * Record a save or a rejection. A rejection teaches the engine: we mark it, then generate
 * one replacement informed by the new "no" — so the act of saying no visibly sharpens the
 * next suggestion. Returns the updated list.
 */
export async function decidePathSuggestion(
  prisma: PrismaClient,
  input: { userId: string; suggestionId: string; decision: PathDecision },
): Promise<PathView[]> {
  const row = await prisma.pathSuggestion.findUnique({ where: { id: input.suggestionId } });
  if (!row || row.candidateId !== input.userId) {
    return listPathSuggestions(prisma, input.userId);
  }

  await prisma.pathSuggestion.update({
    where: { id: row.id },
    data: { status: input.decision, decidedAt: new Date() },
  });
  await logEvent(prisma, {
    actorId: input.userId,
    eventType: input.decision === 'rejected' ? EVENT_TYPES.pathRejected : 'path_saved',
    targetId: row.id,
    metadata: { pathKey: row.pathKey, title: row.title },
  });

  // The "no" sharpens the next one: backfill a single replacement (best-effort).
  if (input.decision === 'rejected') {
    try {
      return await generatePathSuggestions(prisma, { userId: input.userId, count: 1 });
    } catch {
      /* keep the decision even if the replacement can't be generated */
    }
  }
  return listPathSuggestions(prisma, input.userId);
}
