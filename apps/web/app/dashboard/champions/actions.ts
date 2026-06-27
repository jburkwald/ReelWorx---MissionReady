'use server';

import { createChampion, isDbConfigured, prisma } from '@reelworx/shared/server';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

// Provision a Champion (a TAP/VA/USO counselor) + their office invite link. Any signed-in
// admin can register one — champions aren't org-scoped; they're a platform on-ramp.
export async function createChampionAction(formData: FormData) {
  if (!isDbConfigured()) {
    revalidatePath('/dashboard/champions');
    return;
  }
  const { userId } = await auth();
  if (!userId) return;

  const officeName = formData.get('officeName')?.toString().trim();
  const email = formData.get('email')?.toString().trim();
  if (!officeName || !email) return;

  await createChampion(prisma, { officeName, email });
  revalidatePath('/dashboard/champions');
}
