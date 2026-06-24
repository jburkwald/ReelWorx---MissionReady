'use server';

import { getRole, prisma, suggestMatchesForRole } from '@reelworx/shared/server';
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
