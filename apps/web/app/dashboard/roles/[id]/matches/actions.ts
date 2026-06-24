'use server';

import {
  getRole,
  prisma,
  reachOutToCandidate,
  suggestMatchesForRole,
} from '@reelworx/shared/server';
import { revalidatePath } from 'next/cache';
import { getOrProvisionUser } from '../../../../../lib/db-user';

// Karen presses "Run the Fit Read": score the visible candidate pool against this role,
// narrate the top few, and persist them. Costed and explicit (it spends AI), so it's an
// action — not something a page view silently triggers on every render.
export async function runFitReadAction(roleId: string) {
  const user = await getOrProvisionUser();
  const org = user?.organizationAdmins[0]?.organization;
  if (!user || !org) return;

  // Authorization: the role must belong to the signed-in admin's organization.
  const role = await getRole(prisma, roleId);
  if (!role || role.organizationId !== org.id) return;

  await suggestMatchesForRole(prisma, { roleId, actorUserId: user.id });

  revalidatePath(`/dashboard/roles/${roleId}/matches`);
}

// Intentful reach: spend one invite token to reach out on a match. Authorization is
// enforced inside reachOutToCandidate (the match must belong to the admin's org); an
// out-of-tokens outcome is reflected by the revalidated balance on the page.
export async function reachOutAction(roleId: string, matchId: string) {
  const user = await getOrProvisionUser();
  const org = user?.organizationAdmins[0]?.organization;
  if (!user || !org) return;

  await reachOutToCandidate(prisma, {
    organizationId: org.id,
    actorUserId: user.id,
    matchId,
  });

  revalidatePath(`/dashboard/roles/${roleId}/matches`);
}
