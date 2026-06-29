// Centralized brand strings.
//
// The five-dimension model's PUBLIC name is pending trademark clearance (see the
// backlog's Open Decisions). Per the naming decision, CODE uses neutral names
// (FitProfile, Profile.fitProfile, Role.idealProfile) and ONLY this file carries
// the brand-facing string. If the trademark check fails, change `assessment` here
// once — no code refactor follows.

export const BRAND = {
  product: 'ReelWorx MissionReady',
  // User-facing name of the five-dimension assessment / model. Working name.
  assessment: 'Full Spectrum',
  assessmentShort: 'Full Spectrum',
  assessmentTagline: 'A read on the whole person, across five dimensions.',
} as const;

export type Brand = typeof BRAND;
