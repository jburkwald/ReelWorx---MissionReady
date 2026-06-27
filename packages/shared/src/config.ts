// Platform feature flags — isomorphic, one place to tune.
//
// These gate features that are reserved-but-not-shipped so the model and UI can hold a
// place for them without reworking later. Flip a flag here and the registry, the meter,
// and the entry flow all react. No other file should hardcode these decisions.

export interface FeatureFlags {
  /**
   * Hiring-manager review of a candidate (an employer who has worked with them vouches).
   * Net-new concept reserved in the strength registry at weight 10. OFF today: it renders
   * as a locked "coming soon" slot and strength caps at 90. Turn on when the feature ships.
   */
  hiringManagerReview: boolean;
  /**
   * Voice as an entry mode for the Story Profile agent. OFF can be flipped without
   * affecting text chat or resume upload — those always work.
   */
  voiceEntry: boolean;
}

export const FEATURES: FeatureFlags = {
  hiringManagerReview: false,
  voiceEntry: true,
};
