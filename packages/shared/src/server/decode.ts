// Decoded Credibility (Feature 2.7) — SERVER ONLY.
//
// Translates a candidate's service record into business language a civilian hiring manager
// trusts: the translation, the proof signals, and the values fit. Per-candidate and
// role-independent, so it's generated once and CACHED on Profile.decodedCredibility, then
// reused across every match (the AI cost is paid once per person, not once per match).
//
// Honest by construction: the model is told to translate only what it's given and never
// to fabricate scope (no invented "40 people / millions in equipment" when the numbers
// aren't there). When the AI is unavailable we return a deterministic fallback WITHOUT
// caching it, so a later run with a key upgrades the read instead of locking in a weak one.

import Anthropic from '@anthropic-ai/sdk';
import { getAnthropic, MODELS } from './ai';
import { logEvent } from './events';
import type { DecodedCredibility } from '../types/credibility';
import { Prisma, type PrismaClient } from '../generated/prisma/client';

export interface DecodeInput {
  headline?: string | null;
  mosCode?: string | null;
  skills: string[];
  civilianEquivalents: string[];
  coreValues: string[];
  whatDrivesThem?: string | null;
  whyEachMove: { role: string; why: string }[];
  hometown?: string | null;
}

const recordTool: Anthropic.Tool = {
  name: 'record_decoded_credibility',
  description:
    'Record the employer-facing read of this candidate: a business-language translation ' +
    'of their service record, the concrete proof signals, and what drives them.',
  input_schema: {
    type: 'object',
    properties: {
      headline: {
        type: 'string',
        description: 'One line: who they are and the scope they operated at, in business terms.',
      },
      businessSummary: {
        type: 'string',
        description:
          'A short paragraph translating the service record into civilian business meaning. ' +
          'Decode role/rank into scope (people, responsibility, decisions). Do NOT invent ' +
          'specific numbers that were not provided.',
      },
      proofSignals: {
        type: 'array',
        items: { type: 'string' },
        description: 'Concrete, credible proof points — scope, advancement, recognition, ownership.',
      },
      valuesFit: {
        type: 'string',
        description: 'What genuinely drives them, phrased so an employer can act on it.',
      },
    },
    required: ['headline', 'businessSummary', 'proofSignals', 'valuesFit'],
    additionalProperties: false,
  },
};

const SYSTEM = `You write "Decoded Credibility": you translate a military service record into business language a civilian hiring manager can trust and act on. Turn role and rank into scope — people led, resources and equipment owned, decisions made under pressure, advancement relative to peers.

Two hard rules: translate only what you are given, and never fabricate specifics. If exact numbers (team size, budget) aren't provided, describe the capability honestly without inventing figures. No hype, no résumé clichés — a hiring manager trusts plain, concrete language. Call record_decoded_credibility exactly once.`;

/** AI generation. Throws if the API key is missing — callers handle the fallback. */
export async function decodeCredibility(input: DecodeInput): Promise<DecodedCredibility> {
  const client = getAnthropic();
  const userText = [
    input.headline ? `Self-described as: ${input.headline}` : null,
    input.mosCode ? `Military occupational code: ${input.mosCode}` : null,
    input.skills.length ? `Skills: ${input.skills.join(', ')}` : null,
    input.civilianEquivalents.length
      ? `Civilian-equivalent fields: ${input.civilianEquivalents.join(', ')}`
      : null,
    input.coreValues.length ? `Core values: ${input.coreValues.join(', ')}` : null,
    input.whatDrivesThem ? `What drives them: ${input.whatDrivesThem}` : null,
    input.hometown ? `Roots: ${input.hometown}` : null,
    input.whyEachMove.length
      ? `The why behind their moves:\n${input.whyEachMove
          .map((w) => `- ${w.role}: ${w.why}`)
          .join('\n')}`
      : null,
  ]
    .filter((l): l is string => l !== null)
    .join('\n');

  const res = await client.messages.create({
    model: MODELS.narration,
    max_tokens: 1024,
    system: SYSTEM,
    tools: [recordTool],
    tool_choice: { type: 'tool', name: 'record_decoded_credibility' },
    messages: [{ role: 'user', content: userText || 'No profile details captured yet.' }],
  });

  for (const block of res.content) {
    if (block.type === 'tool_use' && block.name === 'record_decoded_credibility') {
      const out = block.input as Partial<DecodedCredibility>;
      return {
        headline: out.headline?.trim() || fallbackDecode(input).headline,
        businessSummary: out.businessSummary?.trim() || fallbackDecode(input).businessSummary,
        proofSignals: Array.isArray(out.proofSignals) ? out.proofSignals : [],
        valuesFit: out.valuesFit?.trim() || fallbackDecode(input).valuesFit,
      };
    }
  }
  return fallbackDecode(input);
}

// Deterministic, no-AI read assembled from whatever the profile already holds. Plainly
// templated (not faux prose) so the surface still renders the same shape.
function fallbackDecode(input: DecodeInput): DecodedCredibility {
  const field = input.civilianEquivalents[0];
  const headline = input.headline?.trim()
    ? input.headline.trim()
    : field
      ? `${field} — proven in service`
      : 'Veteran with proven, transferable experience';
  const skillsPhrase = input.skills.length
    ? ` Strengths include ${input.skills.slice(0, 4).join(', ')}.`
    : '';
  return {
    headline,
    businessSummary: `${headline}.${skillsPhrase}`.trim(),
    proofSignals: [...input.civilianEquivalents, ...input.skills].slice(0, 5),
    valuesFit:
      input.whatDrivesThem?.trim() ||
      (input.coreValues.length ? `Driven by ${input.coreValues.join(', ')}.` : ''),
  };
}

type ProfileForDecode = {
  id: string;
  userId: string; // Event.actorId is a User FK — log against the candidate, not the Profile
  headline: string | null;
  mosCode: string | null;
  decodedCredibility: unknown;
  fitProfile: unknown;
  whyEachMove: unknown;
};

/**
 * Return a candidate's Decoded Credibility, generating + caching it on first need. The
 * cache means it's computed once per person; a fallback (AI unavailable) is returned but
 * NOT cached, so a later run upgrades it.
 */
export async function ensureDecodedCredibility(
  prisma: PrismaClient,
  profile: ProfileForDecode,
  context?: { hometown?: string | null },
): Promise<DecodedCredibility> {
  if (profile.decodedCredibility) {
    return profile.decodedCredibility as DecodedCredibility;
  }

  const fit = (profile.fitProfile ?? {}) as {
    skillsExperience?: { translatedSkills?: string[]; civilianEquivalents?: string[] };
    motivationValues?: { coreValues?: string[]; whatDrivesThem?: string };
  };
  const input: DecodeInput = {
    headline: profile.headline,
    mosCode: profile.mosCode,
    skills: fit.skillsExperience?.translatedSkills ?? [],
    civilianEquivalents: fit.skillsExperience?.civilianEquivalents ?? [],
    coreValues: fit.motivationValues?.coreValues ?? [],
    whatDrivesThem: fit.motivationValues?.whatDrivesThem ?? null,
    whyEachMove: Array.isArray(profile.whyEachMove)
      ? (profile.whyEachMove as { role: string; why: string }[])
      : [],
    hometown: context?.hometown ?? null,
  };

  let decoded: DecodedCredibility;
  try {
    decoded = await decodeCredibility(input);
  } catch {
    // AI unavailable — return a usable read, but don't cache it (let a later run upgrade).
    return fallbackDecode(input);
  }

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      decodedCredibility: decoded as unknown as Prisma.InputJsonValue,
      // Mirror the summary to the plain-text field used by the single-column ATS render.
      mosTranslation: decoded.businessSummary,
    },
  });
  await logEvent(prisma, {
    actorId: profile.userId,
    eventType: 'credibility_decoded',
    targetId: profile.id,
  });

  return decoded;
}
