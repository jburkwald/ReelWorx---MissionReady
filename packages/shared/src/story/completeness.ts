// Deprecated. Profile strength is now a component registry — see ../profile/strength.ts.
//
// The old answer-counting model (computeProfileCompleteness) was replaced: strength is the
// sum of completed COMPONENTS with fixed weights and caps, not a tally of fields. This file
// is kept only as a pointer; import from ../profile/strength instead.

export {
  computeProfileStrength,
  profileStrengthScore,
  foundationCompleteFromSignals,
  type ProfileStrength,
  type StrengthInput,
} from '../profile/strength';
