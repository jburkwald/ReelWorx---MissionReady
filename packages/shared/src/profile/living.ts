// The Living Profile (Feature 1.6) — isomorphic types.
//
// A profile is not frozen at sign-up. The platform gathers new chapters over time, so a
// placed veteran's story at year five is a five-year career narrative. Append-only and
// timestamped; this is the MVP foundation of the Horizon "career record" ceiling.

export interface LivingChapter {
  id: string;
  title: string;
  body: string;
  /** ISO timestamp the chapter was added. */
  at: string;
}

/** A gentle prompt set for "what's new" — never guilt-based, always growth-framed. */
export const LIVING_CHAPTER_PROMPTS = [
  'What changed for you this season?',
  'A win, big or small, worth remembering?',
  'Something new you took on or learned?',
  'A moment you were proud of how you showed up?',
];
