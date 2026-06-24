// The Full Spectrum Assessment (Feature 1.5) — isomorphic surface.
//
// Items, deterministic scoring, and types. Safe for both apps: the mobile screen renders
// ASSESSMENT_ITEMS, the backend scores responses with scoreAssessment. No server deps.

export * from './types';
export { ASSESSMENT_ITEMS, ASSESSMENT_ITEM_COUNT } from './items';
export { scoreAssessment, hasAssessmentScores } from './score';
