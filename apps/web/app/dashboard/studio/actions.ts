'use server';

import { createStudioReel, isDbConfigured, prisma } from '@reelworx/shared/server';
import { revalidatePath } from 'next/cache';
import { getOrProvisionUser } from '../../../lib/db-user';

// Assemble a story Reel from a locked theme + the company's own footage/link (Feature 5.1).
export async function createStudioReelAction(formData: FormData) {
  if (!isDbConfigured()) {
    revalidatePath('/dashboard/studio');
    return;
  }
  const user = await getOrProvisionUser();
  const org = user?.organizationAdmins[0]?.organization;
  if (!user || !org) return;

  const themeId = formData.get('themeId')?.toString();
  const title = formData.get('title')?.toString().trim();
  const videoUrl = formData.get('videoUrl')?.toString().trim() || null;
  const sourceUrl = formData.get('sourceUrl')?.toString().trim() || null;
  if (!themeId || !title) return;

  await createStudioReel(prisma, {
    organizationId: org.id,
    actorUserId: user.id,
    themeId,
    title,
    videoUrl,
    sourceUrl,
  });
  revalidatePath('/dashboard/studio');
}
