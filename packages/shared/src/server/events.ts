// Event logging — SERVER ONLY.
//
// "Data is the flywheel": log generously from day one so Release-2 dashboards and
// Horizon-level predictive insight are possible without a re-instrumentation project.
// eventType is an open string on purpose; the known ones are centralized here for
// consistency, but adding a new type never requires a migration.

import { Prisma, type PrismaClient } from '../generated/prisma/client';

export const EVENT_TYPES = {
  userCreated: 'user_created',
  organizationCreated: 'organization_created',
  profileView: 'profile_view',
  view: 'view',
  watchComplete: 'watch_complete',
  tokenSpent: 'token_spent',
  matchCreated: 'match_created',
  reachOutSent: 'reach_out_sent',
  pathSuggested: 'path_suggested',
  pathRejected: 'path_rejected',
  hired: 'hired',
} as const;

// Known event types, plus any string (so callers aren't blocked on adding to the map).
export type EventType =
  | (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES]
  | (string & {});

export interface LogEventInput {
  actorId: string;
  eventType: EventType;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}

export async function logEvent(prisma: PrismaClient, input: LogEventInput) {
  return prisma.event.create({
    data: {
      actorId: input.actorId,
      eventType: input.eventType,
      targetId: input.targetId ?? null,
      ...(input.metadata !== undefined
        ? { metadata: input.metadata as Prisma.InputJsonValue }
        : {}),
    },
  });
}
