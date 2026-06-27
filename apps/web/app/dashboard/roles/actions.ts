'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import {
  createRole,
  deriveIdealProfile,
  isDbConfigured,
  prisma,
  syncUser,
} from '@reelworx/shared/server';
import type { IdealProfile } from '@reelworx/shared';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createRoleAction(formData: FormData) {
  // Demo mode: roles aren't persisted — drop the user onto a sample role detail so the
  // flow still resolves somewhere real-feeling.
  if (!isDbConfigured()) redirect('/dashboard/roles/demo-role-ops');

  const { userId } = await auth();
  if (!userId) return;

  const cu = await currentUser();
  const email =
    cu?.primaryEmailAddress?.emailAddress ??
    cu?.emailAddresses[0]?.emailAddress ??
    `${userId}@placeholder.local`;

  const user = await syncUser(prisma, { authId: userId, email, role: 'company_admin' });
  const org = user.organizationAdmins[0]?.organization;
  if (!org) redirect('/dashboard'); // must plant the flag (create org) first

  const title = formData.get('title')?.toString().trim() ?? '';
  const description = formData.get('description')?.toString().trim() ?? '';
  const location = formData.get('location')?.toString().trim() || null;
  const videoUrl = formData.get('videoUrl')?.toString().trim() || null;
  if (!title || !description) redirect('/dashboard/roles/new');

  // Derive the role's Full Spectrum target. If the AI key isn't set yet, save the
  // role anyway with an empty target — it can be re-derived once configured.
  let idealProfile: IdealProfile = {};
  try {
    idealProfile = await deriveIdealProfile({ title, description, location });
  } catch {
    idealProfile = {};
  }

  const role = await createRole(prisma, {
    organizationId: org.id,
    actorUserId: user.id,
    title,
    location,
    description,
    idealProfile,
    videoUrl,
  });

  revalidatePath('/dashboard/roles');
  redirect(`/dashboard/roles/${role.id}`);
}
