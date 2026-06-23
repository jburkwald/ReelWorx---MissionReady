// Shared input validation (zod). Isomorphic — used by API route handlers to validate
// requests and by app forms to validate before submit, so the rules live once.
// Expand per-feature as the MVP build proceeds.

import { z } from 'zod';

export const rootTieSchema = z.object({
  place: z.string().min(2).max(120),
  isPrimary: z.boolean().default(false),
  reason: z.string().max(280).optional(),
});

export const profileVisibilitySchema = z.enum([
  'public',
  'companies_only',
  'private',
]);

// Profile fields a candidate can edit directly (scores are derived, not user-set).
export const profileUpdateSchema = z.object({
  headline: z.string().max(140).optional(),
  openToRelocate: z.boolean().optional(),
  visibility: profileVisibilitySchema.optional(),
  roots: z.array(rootTieSchema).max(10).optional(),
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

// Spending an intent token (Signal layer). Kept deliberate and explicit — never
// auto-applied on a user's behalf (autonomy, SDT).
export const tokenSpendSchema = z.object({
  type: z.enum(['application', 'invite']),
  targetId: z.string().min(1), // Match / Role / Profile id
});
export type TokenSpendInput = z.infer<typeof tokenSpendSchema>;
