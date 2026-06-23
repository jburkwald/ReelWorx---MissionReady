// Story Profile agent runner — SERVER ONLY.
//
// One conversational turn: takes the history, returns the agent's reply plus any
// structured extraction it chose to save. Uses Claude Opus 4.8 (the most capable
// model — the human stakes here are highest). Thinking is left off so replies stay
// snappy for an anxious person mid-conversation; structured extraction rides along
// as a tool_use block in the same response.

import Anthropic from '@anthropic-ai/sdk';
import { getAnthropic, MODELS } from './ai';
import { STORY_SYSTEM_PROMPT } from '../story/prompts';
import type {
  ProfileExtraction,
  StoryMessage,
  StoryTurnResult,
} from '../story/types';

const saveProgressTool: Anthropic.Tool = {
  name: 'save_profile_progress',
  description:
    "Save concrete details the person shared, onto their profile. Call this " +
    "alongside your reply whenever they reveal something worth keeping — a headline, " +
    "skills, values, or the why behind a move. Do not announce it. Only include what " +
    "they actually said.",
  input_schema: {
    type: 'object',
    properties: {
      headline: {
        type: 'string',
        description: 'A short, human headline: who they are and what they want next.',
      },
      skills: {
        type: 'array',
        items: { type: 'string' },
        description: 'Concrete skills, in civilian terms.',
      },
      civilianEquivalents: {
        type: 'array',
        items: { type: 'string' },
        description: 'Civilian-equivalent titles/fields for their experience.',
      },
      coreValues: {
        type: 'array',
        items: { type: 'string' },
        description: 'Values that clearly drive them.',
      },
      whatDrivesThem: {
        type: 'string',
        description: 'A short summary of what motivates them.',
      },
      whyEachMove: {
        type: 'array',
        description: 'The human reason behind a role or move, framed as growth.',
        items: {
          type: 'object',
          properties: {
            role: { type: 'string' },
            why: { type: 'string' },
          },
          required: ['role', 'why'],
          additionalProperties: false,
        },
      },
    },
    additionalProperties: false,
  },
};

export async function runStoryTurn(
  history: StoryMessage[],
): Promise<StoryTurnResult> {
  const client = getAnthropic();
  // Anthropic requires the first message to be from the user — drop any leading
  // assistant turns (e.g. the hardcoded opener the client seeds the chat with).
  const firstUser = history.findIndex((m) => m.role === 'user');
  const trimmed = firstUser >= 0 ? history.slice(firstUser) : [];
  if (trimmed.length === 0) {
    return { reply: '' };
  }
  const messages: Anthropic.MessageParam[] = trimmed.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const res = await client.messages.create({
    model: MODELS.agent,
    max_tokens: 2048,
    system: STORY_SYSTEM_PROMPT,
    tools: [saveProgressTool],
    messages,
  });

  let reply = '';
  let extraction: ProfileExtraction | undefined;
  for (const block of res.content) {
    if (block.type === 'text') {
      reply += block.text;
    } else if (block.type === 'tool_use' && block.name === 'save_profile_progress') {
      extraction = block.input as ProfileExtraction;
    }
  }

  return { reply: reply.trim(), extraction };
}
