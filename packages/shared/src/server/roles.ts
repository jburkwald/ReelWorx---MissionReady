// Role (job) data + AI derivation — SERVER ONLY.
//
// Feature 2.2: when a company fills out a role, the platform derives that role's
// Full Spectrum TARGET (idealProfile) — the human profile the role actually needs —
// so candidates can be scored against it directly (scoreFit in fit/score.ts). A job
// is a Reel{type: job}; createRole creates the Role and its job Reel together.

import Anthropic from '@anthropic-ai/sdk';
import { getAnthropic, MODELS } from './ai';
import { logEvent } from './events';
import { Prisma, type PrismaClient } from '../generated/prisma/client';
import type { IdealProfile } from '../types/fit';
import type { PublicJob } from '../jobs/demo';

const setIdealProfileTool: Anthropic.Tool = {
  name: 'set_ideal_profile',
  description:
    'Record the human profile this role needs across the five dimensions, on 0-100 ' +
    'scales, plus per-dimension weights (higher = matters more for this role). Built ' +
    'on public constructs (Big Five, grit, EI, values) — no proprietary instruments.',
  input_schema: {
    type: 'object',
    properties: {
      personality: {
        type: 'object',
        properties: {
          extraversion: { type: 'number' },
          conscientiousness: { type: 'number' },
          openness: { type: 'number' },
          agreeableness: { type: 'number' },
          emotionalStability: { type: 'number' },
        },
        additionalProperties: false,
      },
      resilienceDrive: {
        type: 'object',
        properties: { gritScore: { type: 'number' } },
        additionalProperties: false,
      },
      emotionalIntelligence: {
        type: 'object',
        properties: {
          selfAwareness: { type: 'number' },
          empathy: { type: 'number' },
          interpersonalSkill: { type: 'number' },
        },
        additionalProperties: false,
      },
      skillsExperience: {
        type: 'object',
        properties: {
          translatedSkills: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
      motivationValues: {
        type: 'object',
        properties: {
          coreValues: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
      weights: {
        type: 'object',
        properties: {
          skillsExperience: { type: 'number' },
          personality: { type: 'number' },
          resilienceDrive: { type: 'number' },
          emotionalIntelligence: { type: 'number' },
          motivationValues: { type: 'number' },
        },
        additionalProperties: false,
      },
    },
    additionalProperties: false,
  },
};

const DERIVE_SYSTEM = `You translate a job into the human profile it actually needs — the same five dimensions used to read a person, so a candidate can be scored directly against the role.

The five dimensions (0-100 each):
- skills & experience (the concrete skills the role needs, in plain terms)
- personality (Big Five: extraversion, conscientiousness, openness, agreeableness, emotional stability)
- resilience & drive (grit)
- emotional & interpersonal intelligence (self-awareness, empathy, interpersonal skill)
- motivation & values (the values that fit this work)

Set weights (0-100) to reflect what truly matters for THIS role — e.g. a sales role weights extraversion, grit, and interpersonal intelligence heavily; a precision technical role weights conscientiousness and relevant skills. Be realistic and specific to the role described. Call set_ideal_profile exactly once.`;

export async function deriveIdealProfile(input: {
  title: string;
  description: string;
  location?: string | null;
}): Promise<IdealProfile> {
  const client = getAnthropic();
  const res = await client.messages.create({
    model: MODELS.narration,
    max_tokens: 1024,
    system: DERIVE_SYSTEM,
    tools: [setIdealProfileTool],
    tool_choice: { type: 'tool', name: 'set_ideal_profile' },
    messages: [
      {
        role: 'user',
        content: `Role: ${input.title}${
          input.location ? ` (${input.location})` : ''
        }\n\nDescription:\n${input.description}`,
      },
    ],
  });

  for (const block of res.content) {
    if (block.type === 'tool_use' && block.name === 'set_ideal_profile') {
      return block.input as IdealProfile;
    }
  }
  return {}; // model declined to fill it — caller can still save the role
}

export interface CreateRoleInput {
  organizationId: string;
  actorUserId: string;
  title: string;
  location?: string | null;
  description: string;
  idealProfile: IdealProfile;
  videoUrl?: string | null;
}

export async function createRole(prisma: PrismaClient, input: CreateRoleInput) {
  const role = await prisma.role.create({
    data: {
      organizationId: input.organizationId,
      title: input.title,
      location: input.location ?? null,
      description: input.description,
      idealProfile: input.idealProfile as Prisma.InputJsonValue,
      // A job IS a Reel{type: job} — video-first by default (realistic job preview).
      reels: {
        create: {
          type: 'job',
          organizationId: input.organizationId,
          title: input.title,
          videoUrl: input.videoUrl ?? null,
        },
      },
    },
    include: { reels: true },
  });

  await logEvent(prisma, {
    actorId: input.actorUserId,
    eventType: 'role_created',
    targetId: role.id,
    metadata: { title: input.title, hasVideo: Boolean(input.videoUrl) },
  });

  return role;
}

export function listRolesForOrg(prisma: PrismaClient, organizationId: string) {
  return prisma.role.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    include: { reels: true },
  });
}

export function getRole(prisma: PrismaClient, id: string) {
  return prisma.role.findUnique({ where: { id }, include: { reels: true } });
}

// --- Public job board (no auth, no profile) ---

type RoleWithOrgReels = Prisma.RoleGetPayload<{
  include: { organization: true; reels: true };
}>;

function roleToPublicJob(role: RoleWithOrgReels): PublicJob {
  const reel = role.reels.find((r) => r.type === 'job') ?? role.reels[0];
  const description = role.description ?? '';
  return {
    id: role.id,
    title: role.title,
    company: role.organization?.name ?? 'A planted-flag company',
    location: role.location,
    blurb: description.length > 180 ? `${description.slice(0, 180)}…` : description,
    description,
    videoUrl: reel?.videoUrl ?? null,
  };
}

/** Every role, newest first — the public catalog. (A `published` flag can gate this later.) */
export async function listPublishedJobs(
  prisma: PrismaClient,
  take = 60,
): Promise<PublicJob[]> {
  const roles = await prisma.role.findMany({
    orderBy: { createdAt: 'desc' },
    take,
    include: { organization: true, reels: true },
  });
  return roles.map(roleToPublicJob);
}

export async function getPublishedJob(
  prisma: PrismaClient,
  id: string,
): Promise<PublicJob | null> {
  const role = await prisma.role.findUnique({
    where: { id },
    include: { organization: true, reels: true },
  });
  return role ? roleToPublicJob(role) : null;
}
