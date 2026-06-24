'use server';

import { captureFromChampion, prisma } from '@reelworx/shared/server';
import { redirect } from 'next/navigation';

// Public opt-in via a champion's link (Feature 8.1 / 8.2). No auth — capture happens
// BEFORE an account exists. On success we send the member to a thank-you state.
export async function captureLeadAction(code: string, formData: FormData) {
  const email = formData.get('email')?.toString().trim() || null;
  const phone = formData.get('phone')?.toString().trim() || null;
  if (!email && !phone) redirect(`/c/${code}`);

  try {
    await captureFromChampion(prisma, { code, email, phone });
  } catch {
    /* best-effort capture — still thank the member */
  }
  redirect(`/c/${code}?done=1`);
}
