import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma, syncUser, type SyncedUser } from '@reelworx/shared/server';

// Server-only. Provisions (or fetches) the DB user for the signed-in company person.
// The web app is the company surface, so the role is company_admin.
export async function getOrProvisionUser(): Promise<SyncedUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const cu = await currentUser();
  const email =
    cu?.primaryEmailAddress?.emailAddress ??
    cu?.emailAddresses[0]?.emailAddress ??
    `${userId}@placeholder.local`;

  return syncUser(prisma, { authId: userId, email, role: 'company_admin' });
}
