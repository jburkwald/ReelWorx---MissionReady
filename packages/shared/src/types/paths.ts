// Path detail (Epic 2, Features 2.3 Resource Hub + 2.4 Gaps & the Bridge).
//
// When a suggested path fits, the candidate needs two things to act on it: a plain account
// of what it actually involves (the Resource Hub) and an honest read on what they're
// missing and how to close it (Gaps & the Bridge). Both are GENERATED from public
// knowledge and grounded in the person's real profile — curated/generated, never scraped.
// Cached on PathSuggestion.detail so it's produced once per person+path.

export interface PathGap {
  /** What's missing, in plain terms (e.g. "Forklift / OSHA certification"). */
  label: string;
  /** Why the path needs it — honest, specific to this person where possible. */
  why: string;
  /** A concrete bridge: a SkillBridge slot, a cert, training, an entry route. */
  howToClose: string;
}

export interface PathDetail {
  /** What the work actually involves, day to day. */
  overview: string;
  /** Typical pay, as an honest range or qualitative note — never a fabricated exact figure. */
  payRange: string;
  /** Concrete routes in, in order of accessibility for a transitioning service member. */
  howToGetIn: string[];
  /** The gaps between this person and the path, each with a way to close it. */
  gaps: PathGap[];
}
