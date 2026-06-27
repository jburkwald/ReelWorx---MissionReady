import { auth, currentUser } from '@clerk/nextjs/server';
import {
  prisma,
  syncUser,
  isDbConfigured,
  demoCompanyUser,
  type SyncedUser,
} from '@reelworx/shared/server';

// Server-only. Provisions (or fetches) the DB user for the signed-in company person.
// The web app is the company surface, so the role is company_admin.
export async function getOrProvisionUser(): Promise<SyncedUser | null> {
  // Keyless demo mode: with no database we never touch Clerk — we hand back Karen's
  // pre-provisioned demo workspace so the whole company experience is walkable. The
  // moment DATABASE_URL (and Clerk keys) are set, this falls through to real auth.
  if (!isDbConfigured()) return demoCompanyUser();

  const { userId } = await auth();
  if (!userId) return null;

  const cu = await currentUser();
  const email =
    cu?.primaryEmailAddress?.emailAddress ??
    cu?.emailAddresses[0]?.emailAddress ??
    `${userId}@placeholder.local`;

  return syncUser(prisma, { authId: userId, email, role: 'company_admin' });
}
