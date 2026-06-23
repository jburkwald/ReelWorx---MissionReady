'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import type { UserRole } from '@reelworx/shared';

// Assign the company_admin role on Clerk's user (publicMetadata). This is the web
// side, so the role is always company_admin here. In the data-primitives phase this
// will also provision the User + Organization rows in Postgres.
export async function setCompanyRole() {
  const { userId } = await auth();
  if (!userId) return;

  const role: UserRole = 'company_admin';
  const client = await clerkClient();
  await client.users.updateUser(userId, { publicMetadata: { role } });

  revalidatePath('/dashboard');
}
