'use server';

import {
  createAlert,
  deleteAlert,
  isDbConfigured,
  markAlertViewed,
  prisma,
} from '@reelworx/shared/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getOrProvisionUser } from '../../../lib/db-user';

async function orgId(): Promise<string | null> {
  const user = await getOrProvisionUser();
  return user?.organizationAdmins[0]?.organization?.id ?? null;
}

export async function createAlertAction(formData: FormData) {
  if (!isDbConfigured()) {
    revalidatePath('/dashboard/alerts');
    return;
  }
  const organizationId = await orgId();
  if (!organizationId) return;

  const keyword = formData.get('keyword')?.toString().trim() || null;
  const place = formData.get('place')?.toString().trim() || null;
  if (!keyword && !place) return; // an alert with no criteria matches everyone — skip
  const label =
    formData.get('label')?.toString().trim() ||
    [keyword, place].filter(Boolean).join(' · ') ||
    'New people';

  await createAlert(prisma, { organizationId, label, keyword, place });
  revalidatePath('/dashboard/alerts');
}

export async function deleteAlertAction(id: string) {
  if (!isDbConfigured()) {
    revalidatePath('/dashboard/alerts');
    return;
  }
  const organizationId = await orgId();
  if (!organizationId) return;
  await deleteAlert(prisma, id, organizationId);
  revalidatePath('/dashboard/alerts');
}

// Opening an alert resets its "new" baseline, then drops Karen into the live search.
export async function viewAlertAction(id: string, keyword: string | null, place: string | null) {
  // In demo mode skip the DB write but still drop into the (demo-backed) people search.
  if (isDbConfigured()) {
    const organizationId = await orgId();
    if (!organizationId) return;
    await markAlertViewed(prisma, id, organizationId);
  }
  const params = new URLSearchParams();
  if (keyword) params.set('q', keyword);
  if (place) params.set('place', place);
  redirect(`/dashboard/people?${params.toString()}`);
}
