// Path detail — Resource Hub (2.3) + Gaps & the Bridge (2.4) — SERVER ONLY.
//
// Turns a suggested path into something the candidate can act on: what the work involves,
// what it pays, how to get in, and — grounded in THEIR profile — the gaps plus a concrete
// bridge for each. Generated from public knowledge (never scraped), and honest: no
// fabricated salary figures, and gaps name real shortfalls against this specific person.
// Cached on PathSuggestion.detail so the AI cost is paid once per person+path.

import Anthropic from '@anthropic-ai/sdk';
import { getAnthropic, MODELS } from './ai';
import type { PathDetail } from '../types/paths';
import { Prisma, type PrismaClient } from '../generated/prisma/client';

const tool: Anthropic.Tool = {
  name: 'record_path_detail',
  description: 'Record the practical detail for this career path, tailored to this person.',
  input_schema: {
    type: 'object',
    properties: {
      overview: { type: 'string', description: 'What the work actually involves, day to day. Plain language.' },
      payRange: {
        type: 'string',
        description: 'Typical pay as an honest range or qualitative note (e.g. "$55k–$80k, varies by region"). Never invent a precise figure.',
      },
      howToGetIn: {
        type: 'array',
        items: { type: 'string' },
        description: 'Concrete routes in, most accessible first for a transitioning service member (SkillBridge, certs, entry roles).',
      },
      gaps: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string', description: 'What is missing, in plain terms.' },
            why: { type: 'string', description: 'Why the path needs it.' },
            howToClose: { type: 'string', description: 'A concrete bridge: a SkillBridge slot, a cert, training, an entry route.' },
          },
          required: ['label', 'why', 'howToClose'],
          additionalProperties: false,
        },
        description: 'Real gaps between THIS person and the path. Empty if they already meet it.',
      },
    },
    required: ['overview', 'payRange', 'howToGetIn', 'gaps'],
    additionalProperties: false,
  },
};

const SYSTEM = `You write the practical guide for a career path a transitioning service member is considering: what it involves, what it pays, how to get in, and the honest gaps between them and the path with a concrete way to close each.

Ground everything in public, well-known information about the field — never invent precise salary numbers (use honest ranges or "varies"), and never fabricate requirements. The gaps must be specific to the person described: compare what they already have (skills, experience, the read on who they are) to what the path needs, and for each gap point to a real bridge — a SkillBridge slot, a named kind of certification, training, or an entry-level route. If they already meet the path, return no gaps. Call record_path_detail exactly once.`;

function fallback(title: string): PathDetail {
  return {
    overview: `A practical guide for ${title} will appear here once the guidance service is connected.`,
    payRange: 'Varies by role and region.',
    howToGetIn: [],
    gaps: [],
  };
}

/**
 * Return a path's detail, generating + caching on first view. Grounded in the candidate's
 * profile so the gaps are real. Degrades to a placeholder (not cached) if the AI is down.
 */
export async function getOrCreatePathDetail(
  prisma: PrismaClient,
  input: { userId: string; pathId: string },
): Promise<PathDetail | null> {
  const path = await prisma.pathSuggestion.findUnique({ where: { id: input.pathId } });
  if (!path || path.candidateId !== input.userId) return null;
  if (path.detail) return path.detail as unknown as PathDetail;

  const profile = await prisma.profile.findUnique({ where: { userId: input.userId } });

  let detail: PathDetail;
  try {
    const client = getAnthropic();
    const res = await client.messages.create({
      model: MODELS.narration,
      max_tokens: 1536,
      system: SYSTEM,
      tools: [tool],
      tool_choice: { type: 'tool', name: 'record_path_detail' },
      messages: [
        {
          role: 'user',
          content: [
            `Path: ${path.title}`,
            path.reasoning ? `Why it was suggested: ${path.reasoning}` : null,
            `\nThe person (Full Spectrum profile JSON): ${JSON.stringify(profile?.fitProfile ?? {})}`,
            profile?.headline ? `Headline: ${profile.headline}` : null,
          ]
            .filter((l): l is string => l !== null)
            .join('\n'),
        },
      ],
    });
    const block = res.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'record_path_detail',
    );
    if (!block) return fallback(path.title);
    const out = block.input as PathDetail;
    detail = {
      overview: out.overview ?? '',
      payRange: out.payRange ?? 'Varies.',
      howToGetIn: Array.isArray(out.howToGetIn) ? out.howToGetIn : [],
      gaps: Array.isArray(out.gaps) ? out.gaps : [],
    };
  } catch {
    return fallback(path.title); // not cached — a later keyed run generates the real thing
  }

  await prisma.pathSuggestion.update({
    where: { id: path.id },
    data: { detail: detail as unknown as Prisma.InputJsonValue },
  });
  return detail;
}
