// Decoded Credibility (Epic 2, Feature 2.7) — the employer's read.
//
// Karen can't read "Platoon Sergeant, E-7"; she can read "led 40 people, accountable for
// millions in dollars of equipment, advanced ahead of peers." This is the structured
// translation of a service record into business language a civilian employer trusts — the
// translation, the proof signals, and the values fit, in one view (the backlog's three).
//
// Per-candidate and role-independent, so it's generated once and cached on the Profile
// (Profile.decodedCredibility), then reused across every match. The plain-text summary is
// mirrored to Profile.mosTranslation for the single-column ATS render (Feature 1.3).

export interface DecodedCredibility {
  /** One-line business framing of who this person is and the scope they operated at. */
  headline: string;
  /** A short paragraph translating the service record into civilian business meaning. */
  businessSummary: string;
  /** Concrete, credible proof points — scope of responsibility, advancement, recognition. */
  proofSignals: string[];
  /** What genuinely drives them, in terms an employer can act on. */
  valuesFit: string;
}
