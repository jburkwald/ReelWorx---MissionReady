'use server';

import { captureOwnedLead, prisma } from '@reelworx/shared/server';
import { redirect } from 'next/navigation';

// Public owned opt-in (Feature 8.2) — no auth, captured before an account exists.
export async function joinAction(formData: FormData) {
  const email = formData.get('email')?.toString().trim() || null;
  const phone = formData.get('phone')?.toString().trim() || null;
  if (!email && !phone) redirect('/join');

  try {
    await captureOwnedLead(prisma, { email, phone });
  } catch {
    /* best-effort — still thank them */
  }
  redirect('/join?done=1');
}
