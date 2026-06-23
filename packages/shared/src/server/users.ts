// User / Organization provisioning — SERVER ONLY.
//
// One function both apps call (web directly server-side, mobile over HTTP via /api/me)
// so identity logic lives once. A candidate gets a Profile on creation; a company_admin
// gets an Organization later via the "plant your flag" step (createOrganizationForAdmin).

import type { UserRole } from '../types/domain';
import type { PrismaClient } from '../generated/prisma/client';
import { EVENT_TYPES, logEvent } from './events';

// What both apps need back about the signed-in person.
const userInclude = {
  profile: true,
  organizationAdmins: { include: { organization: true } },
} as const;

export interface SyncUserInput {
  authId: string; // Clerk user id
  email: string;
  role?: UserRole; // web → company_admin, mobile → candidate (default)
}

/**
 * Upsert the DB user from a Clerk identity. Idempotent: returns the existing user
 * (refreshing email if it changed), or creates one with a role-appropriate child.
 */
export async function syncUser(prisma: PrismaClient, input: SyncUserInput) {
  const existing = await prisma.user.findUnique({
    where: { authId: input.authId },
    include: userInclude,
  });

  if (existing) {
    if (existing.email !== input.email) {
      return prisma.user.update({
        where: { id: existing.id },
        data: { email: input.email },
        include: userInclude,
      });
    }
    return existing;
  }

  const role: UserRole = input.role ?? 'candidate';
  const created = await prisma.user.create({
    data: {
      authId: input.authId,
      email: input.email,
      role,
      // Candidates get a Profile immediately so the Story Profile build flow has a home.
      ...(role === 'candidate' ? { profile: { create: {} } } : {}),
    },
    include: userInclude,
  });

  await logEvent(prisma, {
    actorId: created.id,
    eventType: EVENT_TYPES.userCreated,
    metadata: { role },
  });

  return created;
}

export type SyncedUser = Awaited<ReturnType<typeof syncUser>>;

export interface CreateOrganizationInput {
  userId: string; // the company_admin User.id
  name: string;
  plantedFlagStatement?: string;
}

/**
 * The "plant your flag" step: create the Organization and link the admin. The
 * planted-flag statement is a first-class trust signal, not an afterthought.
 */
export async function createOrganizationForAdmin(
  prisma: PrismaClient,
  input: CreateOrganizationInput,
) {
  const org = await prisma.organization.create({
    data: {
      name: input.name,
      plantedFlagStatement: input.plantedFlagStatement ?? null,
      admins: { create: { userId: input.userId } },
    },
  });

  await logEvent(prisma, {
    actorId: input.userId,
    eventType: EVENT_TYPES.organizationCreated,
    targetId: org.id,
    metadata: { name: input.name },
  });

  return org;
}
