// Domain enums as string-literal unions.
//
// These mirror the Prisma enums in prisma/schema.prisma, but live here as plain
// TypeScript so the MOBILE app (which must never import @prisma/client) and any
// isomorphic code can reference them. The Prisma schema is the DB source of truth;
// keep these aligned by hand (the set is small and changes rarely).

export type UserRole = 'candidate' | 'company_admin' | 'admin';

export type ProfileVisibility = 'public' | 'companies_only' | 'private';

export type ReelType = 'job' | 'candidate' | 'culture' | 'campus' | 'franchise';

export type CastAudience = 'general' | 'personalized';

export type TokenType = 'application' | 'invite';
export type TokenStatus = 'active' | 'spent' | 'expired';
export type TokenSource = 'monthly_grant' | 'purchased';

export type MatchStatus =
  | 'suggested'
  | 'applied'
  | 'invited'
  | 'connected'
  | 'passed';

export type PathStatus = 'suggested' | 'saved' | 'rejected';

export type AdvocateType =
  | 'employee'
  | 'veteran_advocate'
  | 'influencer'
  | 'champion';

export type AdvocateStatus =
  | 'active'
  | 'pending_eligibility'
  | 'approved'
  | 'rejected';

export type NotificationChannel = 'push' | 'sms' | 'email';

// A place a candidate has ties to (normalized into the `roots` table). Drives the
// "Come Home" search (Feature 3.3). Exactly one root should be `isPrimary`.
export interface RootTie {
  place: string;
  isPrimary: boolean;
  reason?: string;
}
