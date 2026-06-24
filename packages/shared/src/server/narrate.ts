// The Fit Read narration layer (Epic 2, Feature 2.2) — SERVER ONLY.
//
// scoreFit (fit/score.ts) produces the transparent, deterministic numbers. This layer
// turns those numbers into the plain-language "why this person fits" and the HONEST
// gaps — the half of the Fit Read a hiring manager actually reads. The numbers are an
// input the model narrates, never something it invents: the prose must agree with the
// scores. Honesty is a product principle here (the backlog calls them "honest gaps"),
// so the narration names real shortfalls instead of selling.
//
// Degrades gracefully: if ANTHROPIC_API_KEY is absent the function still returns a full
// FitBreakdown built from a deterministic template, so the surface always renders (same
// pattern as deriveIdealProfile saving a role with an empty target).

import Anthropic from '@anthropic-ai/sdk';
import { getAnthropic, MODELS } from './ai';
import { scoreFit, type ScoreFitResult } from '../fit/score';
import {
  FIT_DIMENSION_LABELS,
  type FitBreakdown,
  type FitDimension,
  type FitProfile,
  type IdealProfile,
} from '../types/fit';

export interface FitReadContext {
  roleTitle: string;
  /** The candidate's own headline, if they wrote one (Story over specification). */
  candidateHeadline?: string | null;
  /** Decoded military→civilian summary, if present (feeds Decoded Credibility, 2.7). */
  mosTranslation?: string | null;
}

const recordFitReadTool: Anthropic.Tool = {
  name: 'record_fit_read',
  description:
    'Record the plain-language fit read for this candidate against this role: why ' +
    'they fit (one short, concrete paragraph a hiring manager can act on) and the ' +
    'honest gaps (real shortfalls, not filler — empty if there are none worth naming).',
  input_schema: {
    type: 'object',
    properties: {
      plainLanguageWhy: {
        type: 'string',
        description:
          'One paragraph, plain business English. Ground it in the dimension scores ' +
          'provided. Decode military experience into civilian terms. No hype, no resume ' +
          'clichés, no invented facts.',
      },
      honestGaps: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Concrete gaps where the candidate is below what the role asks, each phrased ' +
          'as something checkable or closeable. Empty array if none are material.',
      },
    },
    required: ['plainLanguageWhy', 'honestGaps'],
    additionalProperties: false,
  },
};

const NARRATE_SYSTEM = `You write the Fit Read: a hiring manager's plain-language explanation of how well a specific person fits a specific role, across five dimensions (skills & experience, personality, resilience & drive, emotional & interpersonal intelligence, motivation & values).

You are given deterministic 0-100 scores per dimension and an overall. Your job is to NARRATE those numbers, not re-judge them — the prose must agree with the scores. Lead with the human, in story terms, not a spec sheet. Decode military experience into business meaning a civilian employer can trust (e.g. "led 40 people and was accountable for millions in equipment", not "Platoon Sergeant, E-7").

Be honest. If a constrained dimension scores low, that is a real gap and it belongs in honestGaps — never paper over it. A trustworthy "here's where they're light" is worth more than a sales pitch. Call record_fit_read exactly once.`;

/** Render the scores compactly for the model — only what it needs to narrate truthfully. */
function scoreSummary(score: ScoreFitResult): string {
  const lines = (Object.keys(FIT_DIMENSION_LABELS) as FitDimension[]).map((dim) => {
    const constrained = score.constrainedDimensions.includes(dim);
    const val = score.dimensionScores[dim];
    return `- ${FIT_DIMENSION_LABELS[dim]}: ${
      constrained ? `${val}/100` : 'not required by this role'
    }`;
  });
  return `Overall fit: ${score.overall}/100\n${lines.join('\n')}`;
}

export async function narrateFitRead(
  candidate: FitProfile,
  ideal: IdealProfile,
  score: ScoreFitResult,
  ctx: FitReadContext,
): Promise<Pick<FitBreakdown, 'plainLanguageWhy' | 'honestGaps'>> {
  const client = getAnthropic();
  const userText = [
    `Role: ${ctx.roleTitle}`,
    ctx.candidateHeadline ? `Candidate headline: ${ctx.candidateHeadline}` : null,
    ctx.mosTranslation ? `Decoded service record: ${ctx.mosTranslation}` : null,
    '',
    'Dimension scores (the source of truth — narrate these):',
    scoreSummary(score),
    '',
    `Candidate profile (JSON):\n${JSON.stringify(candidate)}`,
    `Role target (JSON):\n${JSON.stringify(ideal)}`,
  ]
    .filter((l) => l !== null)
    .join('\n');

  const res = await client.messages.create({
    model: MODELS.narration,
    max_tokens: 1024,
    system: NARRATE_SYSTEM,
    tools: [recordFitReadTool],
    tool_choice: { type: 'tool', name: 'record_fit_read' },
    messages: [{ role: 'user', content: userText }],
  });

  for (const block of res.content) {
    if (block.type === 'tool_use' && block.name === 'record_fit_read') {
      const out = block.input as Partial<FitBreakdown>;
      return {
        plainLanguageWhy: out.plainLanguageWhy?.trim() || fallbackWhy(score, ctx),
        honestGaps: Array.isArray(out.honestGaps) ? out.honestGaps : fallbackGaps(score),
      };
    }
  }
  return { plainLanguageWhy: fallbackWhy(score, ctx), honestGaps: fallbackGaps(score) };
}

// Deterministic narration used when the AI is unavailable. Plainly templated (not faux
// prose pretending to be the model) so the surface still renders the same shape.
function strongDims(score: ScoreFitResult): FitDimension[] {
  return score.constrainedDimensions
    .filter((d) => score.dimensionScores[d] >= 70)
    .sort((a, b) => score.dimensionScores[b] - score.dimensionScores[a]);
}

function fallbackWhy(score: ScoreFitResult, ctx: FitReadContext): string {
  const strong = strongDims(score).map((d) => FIT_DIMENSION_LABELS[d].toLowerCase());
  const lead = ctx.candidateHeadline ? `${ctx.candidateHeadline}. ` : '';
  if (strong.length === 0) {
    return `${lead}Overall fit for ${ctx.roleTitle} is ${score.overall} out of 100 — see the per-dimension breakdown for where they line up.`;
  }
  const list =
    strong.length === 1
      ? strong[0]
      : `${strong.slice(0, -1).join(', ')} and ${strong[strong.length - 1]}`;
  return `${lead}Overall fit for ${ctx.roleTitle} is ${score.overall} out of 100, anchored by strong alignment on ${list}.`;
}

function fallbackGaps(score: ScoreFitResult): string[] {
  return score.constrainedDimensions
    .filter((d) => score.dimensionScores[d] < 60)
    .sort((a, b) => score.dimensionScores[a] - score.dimensionScores[b])
    .map(
      (d) =>
        `Lighter on ${FIT_DIMENSION_LABELS[d]} (${score.dimensionScores[d]}/100) than this role asks for.`,
    );
}

/**
 * The full Fit Read: deterministic scores + narration, combined into one FitBreakdown
 * (the shape cached on Match.fitBreakdown). Never throws on a missing API key — falls
 * back to deterministic narration so a Fit Read always materializes.
 */
export async function buildFitRead(
  candidate: FitProfile,
  ideal: IdealProfile,
  ctx: FitReadContext,
): Promise<FitBreakdown> {
  const score = scoreFit(candidate, ideal);
  let narration: Pick<FitBreakdown, 'plainLanguageWhy' | 'honestGaps'>;
  try {
    narration = await narrateFitRead(candidate, ideal, score, ctx);
  } catch {
    narration = { plainLanguageWhy: fallbackWhy(score, ctx), honestGaps: fallbackGaps(score) };
  }
  return {
    dimensionScores: score.dimensionScores,
    overall: score.overall,
    plainLanguageWhy: narration.plainLanguageWhy,
    honestGaps: narration.honestGaps,
  };
}
