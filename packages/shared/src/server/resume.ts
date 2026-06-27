// Resume fast-track parsing (Feature 1.2, the upload entry mode) — SERVER ONLY.
//
// This is an INPUT that pre-fills Phase 1 (the record). It is the opposite direction from
// One Profile, Two Outputs (1.3), which RENDERS a clean ATS resume as an output. Here we
// read a resume the candidate already has and extract the structured record, then they
// confirm and correct it. Phase 2 (the why) still runs as a short conversation, because a
// resume has no why.
//
// With ANTHROPIC_API_KEY it's the real parse; without it (keyless demo) it returns a
// canned sample so the upload path walks end to end with no AI key.

import Anthropic from '@anthropic-ai/sdk';
import { getAnthropic, MODELS } from './ai';
import { DEMO_PARSED_RESUME, type ParsedResume } from '../story/phases';

export interface ParseResumeResult {
  parsed: ParsedResume;
  /** True when the canned sample was used (no key / parse failed). */
  demo?: boolean;
}

const setRecordTool: Anthropic.Tool = {
  name: 'set_record',
  description:
    'Record the structured facts from this resume to pre-fill the candidate\'s profile. ' +
    'Only include what the resume actually states. Translate military experience into plain ' +
    'civilian skill terms. Do not invent a headline goal the resume does not support.',
  input_schema: {
    type: 'object',
    properties: {
      headline: { type: 'string', description: 'Short, human headline: who they are and what they want next.' },
      branch: { type: 'string', description: 'Service branch, if present.' },
      rank: { type: 'string', description: 'Final rank, if present.' },
      skills: { type: 'array', items: { type: 'string' }, description: 'Concrete skills in civilian terms.' },
      civilianEquivalents: { type: 'array', items: { type: 'string' }, description: 'Civilian-equivalent job titles/fields.' },
      roots: { type: 'array', items: { type: 'string' }, description: 'Places they have ties to (hometown, duty stations).' },
      serviceSummary: { type: 'string', description: 'One or two plain sentences summarizing the record.' },
    },
    additionalProperties: false,
  },
};

const SYSTEM =
  'You parse a resume into a structured military-to-civilian record. Be faithful to what ' +
  'is written. Call set_record exactly once. Warm and accurate, never inflated.';

export async function parseResume(resumeText: string): Promise<ParseResumeResult> {
  const text = resumeText?.trim();
  if (!text) return { parsed: DEMO_PARSED_RESUME, demo: true };

  try {
    const client = getAnthropic();
    const res = await client.messages.create({
      model: MODELS.narration,
      max_tokens: 1024,
      system: SYSTEM,
      tools: [setRecordTool],
      tool_choice: { type: 'tool', name: 'set_record' },
      messages: [{ role: 'user', content: text }],
    });

    for (const block of res.content) {
      if (block.type === 'tool_use' && block.name === 'set_record') {
        const raw = block.input as Partial<ParsedResume>;
        return {
          parsed: {
            headline: raw.headline,
            branch: raw.branch,
            rank: raw.rank,
            skills: raw.skills ?? [],
            civilianEquivalents: raw.civilianEquivalents ?? [],
            roots: raw.roots ?? [],
            serviceSummary: raw.serviceSummary,
          },
        };
      }
    }
    return { parsed: DEMO_PARSED_RESUME, demo: true };
  } catch {
    // No key or the call failed — keep the upload path walkable.
    return { parsed: DEMO_PARSED_RESUME, demo: true };
  }
}
