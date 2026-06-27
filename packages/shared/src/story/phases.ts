// Story Profile onboarding — phases + entry modes (Features 1.1 / 1.2 / 1.4 / 1.5).
//
// A progress layer that sits ON TOP of the existing thread-by-thread agent. It does not
// replace the agent. Two required foundation phases plus an optional third that holds the
// power-ups. Foundation (the 35) completes when phases 1 and 2 are done; a candidate can
// stop after phase 2 and be Visible.

import { FEATURES } from '../config';
import type { StoryEntryMode } from './types';

export type StoryPhaseId = 'record' | 'story' | 'boosts';

export interface StoryPhase {
  id: StoryPhaseId;
  /** 1-based position. */
  index: number;
  total: number;
  title: string;
  blurb: string;
  /** Required phases make up the foundation. The optional phase holds boosts, not steps. */
  required: boolean;
  /** Human time estimate. No countdown timer is ever shown. */
  timeEstimate: string;
}

export const STORY_PHASES: StoryPhase[] = [
  {
    id: 'record',
    index: 1,
    total: 3,
    title: 'Your record',
    blurb: 'The basics of your service and where your roots are.',
    required: true,
    timeEstimate: 'About 2 minutes',
  },
  {
    id: 'story',
    index: 2,
    total: 3,
    title: 'Your story',
    blurb: 'The why behind your moves, and what you want next.',
    required: true,
    timeEstimate: 'About 2 to 3 minutes',
  },
  {
    id: 'boosts',
    index: 3,
    total: 3,
    title: 'Make it yours',
    blurb: 'Optional boosts that raise your strength: a short intro video and a deeper read.',
    required: false,
    timeEstimate: 'Whenever you like',
  },
];

export const FOUNDATION_PHASE_IDS: StoryPhaseId[] = ['record', 'story'];

export function getStoryPhase(id: StoryPhaseId): StoryPhase {
  return STORY_PHASES.find((p) => p.id === id) ?? STORY_PHASES[0];
}

/** Set the expectation before they start. No countdown — just an honest estimate. */
export const FOUNDATION_INTRO = {
  estimate: 'About 5 minutes to become visible to companies.',
  reassurance: 'Your progress saves if you stop, so you can come back anytime.',
};

// ── Entry modes ────────────────────────────────────────────────────────────────
//
// 1.2 already accepts talk, upload, and text. This makes it an explicit choice at the
// start. All three complete the same foundation and award the same 35 — mode is a
// preference, not a different outcome.

export interface EntryModeDef {
  id: StoryEntryMode;
  label: string;
  blurb: string;
  /** Voice sits behind a flag; text + upload always work. */
  available: boolean;
}

/** Resolve entry modes with the voice flag applied. */
export function getEntryModes(): EntryModeDef[] {
  return [
    {
      id: 'text',
      label: 'Text chat',
      blurb: 'Type it through, one question at a time.',
      available: true,
    },
    {
      id: 'talk',
      label: 'Voice',
      blurb: 'Speak it through. Best for telling your story.',
      available: FEATURES.voiceEntry,
    },
    {
      id: 'upload',
      label: 'Upload a resume to fast track',
      blurb: 'Start from what you have. We pre-fill your record, then you confirm it.',
      available: true,
    },
  ];
}

/** Recruiter-with-your-back tone for the conversational modes. Warm and direct. */
export const ENTRY_MODE_TONE =
  'A recruiter who has your back. Warm and direct, never corporate.';

// ── Resume fast-track (the upload input, not the ATS output 1.3) ────────────────
//
// Parsing a resume pre-fills Phase 1 (the record). A resume has no why, so Phase 2 still
// runs as a short conversation in whichever mode they pick.

export interface ParsedResume {
  headline?: string;
  branch?: string;
  rank?: string;
  skills: string[];
  civilianEquivalents: string[];
  roots: string[];
  serviceSummary?: string;
}

// Canned sample so the keyless demo can walk the upload path with no AI key. Marcus-shaped.
export const DEMO_PARSED_RESUME: ParsedResume = {
  headline: 'Army logistics NCO moving into civilian operations leadership',
  branch: 'U.S. Army',
  rank: 'Staff Sergeant (E-6)',
  skills: ['Supply chain', 'Team leadership', 'Inventory accountability', 'Process improvement'],
  civilianEquivalents: ['Operations Manager', 'Logistics Coordinator'],
  roots: ['Columbus, OH'],
  serviceSummary: 'Eight years leading logistics operations, finishing as the section NCO accountable for a 45-person team and several million dollars of equipment.',
};

// Canned transcript so the keyless demo can preview the voice path with no AI key.
export const DEMO_VOICE_TRANSCRIPT =
  'I spent eight years in Army logistics. Ended up running a 45-person section, accountable for the gear, the people, and getting everything where it needed to be. What I liked most was when a hard day went smooth because the team was ready. That is the part I want to keep doing.';
