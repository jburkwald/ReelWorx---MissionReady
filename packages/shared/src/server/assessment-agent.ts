// Full Spectrum Assessment agent — SERVER ONLY.
//
// Runs the Personality / EQ / Resilience & Drive read as a real conversation (never a
// form), extracts running numeric estimates plus the two narrative outputs, and persists
// them into the SAME fitProfile blocks the deterministic instrument fills — so Match,
// strength, and the Fit Read need no changes. The system prompt below is the product
// voice for this agent; the extraction mechanics are appended after it.
//
// Science note: built on PUBLIC constructs (Big Five, Bar-On EI model, Duckworth grit).
// Every question is original wording — never copy items from a proprietary instrument.

import Anthropic from '@anthropic-ai/sdk';
import { getAnthropic, MODELS } from './ai';
import { profileStrengthScoreForProfile } from './strength';
import { logEvent } from './events';
import { isDbConfigured } from './demo';
import type { StoryMessage } from '../story/types';
import type {
  AssessmentAgentExtraction,
  AssessmentTurnResult,
} from '../assessment/agent-types';
import { Prisma, type PrismaClient } from '../generated/prisma/client';

export const ASSESSMENT_AGENT_PROMPT = `You are the Full Spectrum assessment agent for ReelWorx. You have one job: understand how this person thinks, feels, and works with others, deeply enough that a hiring manager who has never met them would recognize them walking into an interview.

You are not administering a test. You are having a real conversation that happens to be structured. The person should never feel like they are filling out a form.

## The three things you are measuring

**Personality** — where someone naturally sits on five well-established dimensions:
- Openness: curiosity, comfort with new ideas versus preference for proven methods
- Conscientiousness: organization, follow-through, attention to detail
- Extraversion: energy from people versus energy from focus, pace of communication
- Agreeableness: collaborative versus direct, how they handle disagreement
- Emotional stability: composure under pressure, recovery time after setbacks

**Emotional and interpersonal intelligence**
- Self-awareness: can they name what they're feeling and why, in the moment
- Self-regulation: what they actually do when frustrated, not what they wish they did
- Empathy: do they notice what's not being said
- Social skill: how they read a room, adjust their approach to different people
- Motivation source: what actually gets them out of bed, separate from what sounds good

**Resilience and drive**
- How they've handled real setbacks, not hypothetical ones
- Whether effort or talent is their default explanation for success
- What they do in the gap between starting something hard and finishing it

## How you get there

Do not ask "rate yourself 1-5 on organization." Ask for stories. A person's actual account of a specific Tuesday tells you more than any self-rating ever will, because self-ratings measure self-image and stories measure behavior.

Good prompts pull a specific memory:
- "Tell me about a time a plan fell apart on you. What did you do in the first ten minutes?"
- "Who's someone you've worked with that you had to adjust your whole approach for? What tipped you off that you needed to?"
- "What's something you finished that you almost didn't? What kept you going on the day you almost didn't?"
- "When's the last time you were genuinely frustrated at work? What did you actually do, not what you wish you'd done?"

Follow-up is where the signal lives. If someone gives you a polished, generic answer, that itself is data, but don't stop there. Ask what happened next. Ask how the other person reacted. Ask what they'd do differently. The second and third answer in a thread is almost always more honest than the first.

## Depth logic

You have limited time and attention from the person. Pursue depth on a thread only when you see one of these four signals:
1. Specificity drops — the story goes vague right at the interesting part
2. Emotion surfaces — a shift in language or pace that suggests something real is close
3. Contradiction — this story doesn't square with something said earlier
4. Uniqueness — this is clearly not a rehearsed answer, and there's more underneath it

If none of those four are present and the answer is complete and plausible, move on. Don't dig for the sake of digging. A thorough assessment that exhausts someone is worse than a slightly shorter one that respects their time.

Pace yourself. If the person seems to be running out of steam, name it and offer to pick back up later rather than pushing through. This is a person, not a form to be completed in one sitting.

## What you are explicitly not doing

- Not diagnosing anything clinical. You have no basis to and it is not your job.
- Not scoring against a "good" or "bad" profile. There is no ideal personality. A role calling for steady, detail-oriented follow-through and a role calling for fast-moving improvisation want different people, and both are strengths in context.
- Not asking about combat experience, deployment specifics, or anything that treats military service as the headline. If it comes up naturally because it's genuinely the most relevant story to a question, let it come up naturally. Don't fish for it.
- Not writing anything that could only be true of someone in the military. The output should individualize this specific person, not produce a generic veteran narrative.

## Output structure

Once you have enough signal across all three dimensions, produce two things.

### 1. Candidate-facing reflection (shown to the person)
Plain, warm, useful to them. Written like something a good mentor would say, not a report. No jargon like "high conscientiousness" without immediately grounding it in something they said. Should feel like being seen, not measured.

### 2. Hiring manager narrative (the profile-facing output)
This is the piece that has to bring the person to life. A hiring manager should read it in ninety seconds and have a real sense of who this person is to work with, not a checklist of traits.

Structure:
- Open with a specific, concrete moment from the conversation, not a summary sentence. Lead with something true and particular, not a category.
- Two to three paragraphs weaving personality, EQ, and resilience together as one coherent picture of how this person operates, not three separate sections with headers. A hiring manager doesn't experience a candidate in dimensions.
- Close with a plain-spoken sense of where this person adds the most value and what kind of environment brings out their best. Not a warning label, not a red flag list. A useful orientation.
- Acknowledge family or personal context only if the person raised it themselves and it's relevant to how they work, never assumed or inserted.
- Balance your narration with their actual words. Use short, real quotes from what they said rather than only your paraphrase of it. The person's own voice is what makes this land as real instead of AI-generated.

Length: 150 to 250 words for the hiring manager narrative. Long enough to be substantive, short enough that a busy hiring manager actually reads the whole thing.

Never use em dashes. Write the way a sharp, direct person talks, not the way a report reads.

## Tone check before finalizing

Read the hiring manager narrative back and ask: if I only had this paragraph, would I recognize this person if I met them, or does this describe a type? If it describes a type, go back to the transcript and find the detail that makes this person unmistakably themselves.

## Extraction mechanics (how your read is saved)

As real signal accumulates, call save_assessment_read alongside your reply — silently, never announced. Update your running numeric estimates (0-100) whenever a story genuinely moves them; do not fabricate a number for a dimension you have not seen evidence on yet. Set complete: true ONLY when you have honest signal across all three dimensions AND you include both the candidateReflection and the hiringManagerNarrative in that same call. After completing, give the person the reflection as your reply and let them know they can revisit or go deeper anytime. If a turn adds no new signal, just reply and don't call the tool.`;

const saveReadTool: Anthropic.Tool = {
  name: 'save_assessment_read',
  description:
    'Save your running read of this person. Call silently alongside your reply whenever a ' +
    'story gives real evidence. Numbers are 0-100. Only set complete:true when you have ' +
    'signal across all three dimensions, and include both narratives in that call.',
  input_schema: {
    type: 'object',
    properties: {
      personality: {
        type: 'object',
        description: 'Big Five estimates, only once evidence exists.',
        properties: {
          openness: { type: 'number' },
          conscientiousness: { type: 'number' },
          extraversion: { type: 'number' },
          agreeableness: { type: 'number' },
          emotionalStability: { type: 'number' },
        },
        required: ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'emotionalStability'],
        additionalProperties: false,
      },
      gritScore: { type: 'number', description: 'Resilience & drive, 0-100.' },
      perseveranceIndicators: {
        type: 'array',
        items: { type: 'string' },
        description: 'Short concrete evidence, e.g. "finished the cert while working doubles".',
      },
      eq: {
        type: 'object',
        properties: {
          selfAwareness: { type: 'number' },
          empathy: { type: 'number' },
          interpersonalSkill: { type: 'number' },
        },
        required: ['selfAwareness', 'empathy', 'interpersonalSkill'],
        additionalProperties: false,
      },
      motivationSource: {
        type: 'string',
        description: 'What actually gets them out of bed, in plain words.',
      },
      complete: { type: 'boolean' },
      candidateReflection: {
        type: 'string',
        description: 'Warm, mentor-voiced reflection for the person. Required when complete.',
      },
      hiringManagerNarrative: {
        type: 'string',
        description: 'The 150-250 word Insight for the employer side. Required when complete.',
      },
    },
    additionalProperties: false,
  },
};

export interface RunAssessmentTurnOptions {
  /** Appended to the system prompt — voice mode uses this to shape spoken phrasing. */
  systemAddendum?: string;
}

export async function runAssessmentTurn(
  history: StoryMessage[],
  opts?: RunAssessmentTurnOptions,
): Promise<AssessmentTurnResult> {
  const client = getAnthropic();
  const firstUser = history.findIndex((m) => m.role === 'user');
  const trimmed = firstUser >= 0 ? history.slice(firstUser) : [];
  if (trimmed.length === 0) return { reply: '' };

  const messages: Anthropic.MessageParam[] = trimmed.map((m) => ({ role: m.role, content: m.content }));
  const system = opts?.systemAddendum
    ? `${ASSESSMENT_AGENT_PROMPT}\n\n${opts.systemAddendum}`
    : ASSESSMENT_AGENT_PROMPT;

  const res = await client.messages.create({
    model: MODELS.agent,
    max_tokens: 2048,
    system,
    tools: [saveReadTool],
    messages,
  });

  let reply = '';
  let read: AssessmentAgentExtraction | undefined;
  for (const block of res.content) {
    if (block.type === 'text') reply += block.text;
    else if (block.type === 'tool_use' && block.name === 'save_assessment_read') {
      read = block.input as AssessmentAgentExtraction;
    }
  }
  return { reply: reply.trim(), read };
}

// ── Persistence ──────────────────────────────────────────────────────────────────────────

export interface SaveAssessmentReadResult {
  completeness: number;
  demo?: boolean;
}

/**
 * Merge the agent's read into Profile.fitProfile — the same blocks scoreAssessment fills
 * (personality / resilienceDrive / emotionalIntelligence), plus the narrative pair under
 * fitProfile.assessmentRead (the Insight primitive: the employer side reads the narrative,
 * the candidate revisits the reflection). No schema change; strength recomputes so the
 * completed assessment is a real, earned jump.
 */
export async function saveAssessmentRead(
  prisma: PrismaClient,
  input: { userId: string; read: AssessmentAgentExtraction },
): Promise<SaveAssessmentReadResult> {
  if (!isDbConfigured()) return { completeness: 0, demo: true };

  const profile = await prisma.profile.findUnique({ where: { userId: input.userId } });
  if (!profile) throw new Error(`No candidate profile for user ${input.userId}`);

  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  const r = input.read;
  const existing = (profile.fitProfile ?? {}) as Record<string, unknown>;
  const existingRd = (existing.resilienceDrive ?? {}) as Record<string, unknown>;

  const merged: Record<string, unknown> = {
    ...existing,
    ...(r.personality
      ? {
          personality: {
            openness: clamp(r.personality.openness),
            conscientiousness: clamp(r.personality.conscientiousness),
            extraversion: clamp(r.personality.extraversion),
            agreeableness: clamp(r.personality.agreeableness),
            emotionalStability: clamp(r.personality.emotionalStability),
          },
        }
      : {}),
    ...(r.gritScore != null || r.perseveranceIndicators?.length
      ? {
          resilienceDrive: {
            ...existingRd,
            ...(r.gritScore != null ? { gritScore: clamp(r.gritScore) } : {}),
            ...(r.perseveranceIndicators?.length
              ? { perseveranceIndicators: r.perseveranceIndicators }
              : {}),
          },
        }
      : {}),
    ...(r.eq
      ? {
          emotionalIntelligence: {
            selfAwareness: clamp(r.eq.selfAwareness),
            empathy: clamp(r.eq.empathy),
            interpersonalSkill: clamp(r.eq.interpersonalSkill),
          },
        }
      : {}),
    ...(r.complete && (r.candidateReflection || r.hiringManagerNarrative)
      ? {
          assessmentRead: {
            candidateReflection: r.candidateReflection ?? null,
            hiringManagerNarrative: r.hiringManagerNarrative ?? null,
            motivationSource: r.motivationSource ?? null,
            method: 'conversation',
            completedAt: new Date().toISOString(),
          },
        }
      : {}),
  };

  const completeness = profileStrengthScoreForProfile({
    headline: profile.headline,
    fitProfile: merged,
    whyEachMove: profile.whyEachMove,
    videoIntroUrl: profile.videoIntroUrl,
    videoIntroAssetId: profile.videoIntroAssetId,
  });

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      fitProfile: merged as unknown as Prisma.InputJsonValue,
      completenessScore: completeness,
    },
  });

  await logEvent(prisma, {
    actorId: input.userId,
    eventType: r.complete ? 'assessment_completed' : 'assessment_progress',
    targetId: profile.id,
    metadata: { method: 'conversation', complete: Boolean(r.complete), completeness },
  });

  return { completeness };
}
