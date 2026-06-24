// The Full Spectrum item bank (Feature 1.5).
//
// ORIGINAL statements written for this platform, built on public psychological
// constructs (Big Five personality, grit/perseverance research, emotional-intelligence
// theory). Plain, veteran-resonant language on purpose — no clinical jargon, no wording
// lifted from any proprietary instrument (see docs/DATA_MODEL.md IP note). Reverse-keyed
// items are flagged so a uniform "agree to everything" set doesn't inflate a score.
//
// Display order groups by dimension so the screen reads as calm, themed sections rather
// than a wall of questions ("never overwhelmed" — Feature 1.2's pacing principle).

import type { AssessmentItem } from './types';

export const ASSESSMENT_ITEMS: AssessmentItem[] = [
  // — Personality (Big Five), two items per facet —
  { id: 'ext1', dimension: 'personality', facet: 'extraversion', statement: 'I find energy in being around other people.' },
  { id: 'ext2', dimension: 'personality', facet: 'extraversion', statement: 'I tend to take charge when a group needs direction.' },

  { id: 'con1', dimension: 'personality', facet: 'conscientiousness', statement: 'I follow through on what I commit to, even when no one is checking.' },
  { id: 'con2', dimension: 'personality', facet: 'conscientiousness', statement: 'I keep my plans, my schedule, and my gear in order.' },

  { id: 'opn1', dimension: 'personality', facet: 'openness', statement: 'I’m drawn to learning things outside what I already know.' },
  { id: 'opn2', dimension: 'personality', facet: 'openness', statement: 'I look for a better way to do a job instead of sticking to the standard one.' },

  { id: 'agr1', dimension: 'personality', facet: 'agreeableness', statement: 'I put real effort into understanding where other people are coming from.' },
  { id: 'agr2', dimension: 'personality', facet: 'agreeableness', statement: 'I’d rather find a solution that works for everyone than win the argument.' },

  { id: 'stb1', dimension: 'personality', facet: 'emotionalStability', statement: 'I stay level-headed when things go sideways.' },
  { id: 'stb2', dimension: 'personality', facet: 'emotionalStability', statement: 'Pressure tends to rattle me.', reverse: true },

  // — Resilience & drive (grit: perseverance + consistency of effort) —
  { id: 'grt1', dimension: 'resilienceDrive', facet: 'gritScore', statement: 'I finish what I start, even after it stops being exciting.' },
  { id: 'grt2', dimension: 'resilienceDrive', facet: 'gritScore', statement: 'Setbacks make me dig in, not back off.' },
  { id: 'grt3', dimension: 'resilienceDrive', facet: 'gritScore', statement: 'I’ve kept working toward goals that took years to reach.' },

  // — Emotional intelligence, two items per facet —
  { id: 'awr1', dimension: 'emotionalIntelligence', facet: 'selfAwareness', statement: 'I can usually name what I’m feeling and why.' },
  { id: 'awr2', dimension: 'emotionalIntelligence', facet: 'selfAwareness', statement: 'I know how my mood affects the people around me.' },

  { id: 'emp1', dimension: 'emotionalIntelligence', facet: 'empathy', statement: 'I pick up on how someone’s doing before they say a word.' },
  { id: 'emp2', dimension: 'emotionalIntelligence', facet: 'empathy', statement: 'Other people’s situations genuinely move me.' },

  { id: 'int1', dimension: 'emotionalIntelligence', facet: 'interpersonalSkill', statement: 'I can defuse tension between people when it flares up.' },
  { id: 'int2', dimension: 'emotionalIntelligence', facet: 'interpersonalSkill', statement: 'People tend to open up to me.' },
];

export const ASSESSMENT_ITEM_COUNT = ASSESSMENT_ITEMS.length;
