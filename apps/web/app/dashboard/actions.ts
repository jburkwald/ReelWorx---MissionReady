'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import {
  createOrganizationForAdmin,
  prisma,
  syncUser,
} from '@reelworx/shared/server';
import { revalidatePath } from 'next/cache';

// The "plant your flag" step: create the company's Organization in the DB and link
// the current user as its admin. The planted-flag statement is a first-class trust
// signal (relatedness), captured here rather than as a free-text afterthought.
export async function createOrganization(formData: FormData) {
  const { userId } = await auth();
  if (!userId) return;

  const cu = await currentUser();
  const email =
    cu?.primaryEmailAddress?.emailAddress ??
    cu?.emailAddresses[0]?.emailAddress ??
    `${userId}@placeholder.local`;

  const dbUser = await syncUser(prisma, {
    authId: userId,
    email,
    role: 'company_admin',
  });

  const name = (formData.get('name')?.toString() ?? '').trim() || 'Your Company';
  const statement =
    formData.get('plantedFlag')?.toString().trim() || undefined;

  await createOrganizationForAdmin(prisma, {
    userId: dbUser.id,
    name,
    plantedFlagStatement: statement,
  });

  revalidatePath('/dashboard');
}
