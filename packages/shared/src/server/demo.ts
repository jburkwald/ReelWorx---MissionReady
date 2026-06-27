// Keyless demo mode — SERVER ONLY.
//
// The whole platform is built to be *walkable* before any service is provisioned:
// the candidate side already falls back to scripted guidance with no AI key, and the
// public job board renders DEMO_JOBS with no database. This module extends the same
// courtesy to the company side (Karen's experience) so the FULL interface is testable
// in a browser with zero setup.
//
// The single switch is DATABASE_URL: when it is unset the app runs in demo mode and
// every read-function below returns believable, correctly-typed sample data instead of
// touching Postgres. The moment a real DATABASE_URL is present, all of this is bypassed
// and the real queries run — nothing here leaks into a configured deployment.
//
// Demo data is anchored on the personas in CLAUDE.md: Karen's company is Ridgeline
// Logistics; Marcus is the standout candidate (the "Exceptional fit" celebratory moment).

import type { Prisma } from '../generated/prisma/client';
import { fitTier } from '../fit/score';
import { computeProfileStrength } from '../profile/strength';
import type { IdealProfile, FitBreakdown } from '../types/fit';
import type { DecodedCredibility } from '../types/credibility';
import type { SyncedUser } from './users';
import type { SuggestedMatch } from './matches';
import type { PeopleSearchResult } from './search';
import type { ChampionView } from './champions';
import type { AlertView } from './alerts';
import type { StudioReelView } from './studio';
import type { EmployerDashboard, CandidateDashboard } from './dashboard';

/**
 * The master switch. Demo mode is on whenever no database is configured — exactly the
 * state of a fresh checkout. Set DATABASE_URL (and Clerk keys) to run the real backend.
 */
export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim());
}

export const DEMO_ORG_ID = 'demo-org';
export const DEMO_ADMIN_ID = 'demo-admin';
/** Karen's monthly outreach allotment, shown spent-down so the scarcity is legible. */
export const DEMO_INVITE_BALANCE = 14;

const now = new Date('2026-06-20T15:00:00.000Z');

// ── Company identity (the "plant your flag" result) ──────────────────────────

const demoOrganization: Prisma.OrganizationGetPayload<true> = {
  id: DEMO_ORG_ID,
  name: 'Ridgeline Logistics',
  pageVideoUrl: null,
  industry: 'Logistics & Distribution',
  locations: ['Columbus, OH', 'Indianapolis, IN'] as unknown as Prisma.JsonValue,
  verified: true,
  description:
    'A fast-growing regional distribution company that runs on ownership, calm under pressure, and taking care of its people.',
  plantedFlagStatement:
    'We hire those who served because the work rewards exactly what the service builds: leadership under pressure, accountability, and looking after the people next to you.',
  createdAt: now,
  updatedAt: now,
};

/**
 * The signed-in company person, fully provisioned with an Organization — so every
 * dashboard surface renders its "workspace" state rather than the plant-your-flag or
 * connect-a-database states. Mirrors getOrProvisionUser's SyncedUser shape exactly.
 */
export function demoCompanyUser(): SyncedUser {
  return {
    id: DEMO_ADMIN_ID,
    role: 'company_admin',
    authId: 'demo-auth-admin',
    email: 'karen@ridgelinelogistics.com',
    hometown: null,
    currentLocation: null,
    createdAt: now,
    profile: null,
    organizationAdmins: [
      {
        id: 'demo-org-admin',
        userId: DEMO_ADMIN_ID,
        organizationId: DEMO_ORG_ID,
        organization: demoOrganization,
      },
    ],
  };
}

// ── Roles (jobs) + their derived ideal profiles ──────────────────────────────

type RoleWithReels = Prisma.RoleGetPayload<{ include: { reels: true } }>;

function demoReel(roleId: string, title: string, videoUrl: string | null): RoleWithReels['reels'][number] {
  return {
    id: `${roleId}-reel`,
    type: 'job',
    ownerUserId: null,
    organizationId: DEMO_ORG_ID,
    roleId,
    themeId: null,
    title,
    caption: null,
    videoUrl,
    videoAssetId: null,
    videoProvider: null,
    duration: videoUrl ? 72 : null,
    createdAt: now,
  };
}

function demoRoleRow(args: {
  id: string;
  title: string;
  location: string | null;
  description: string;
  ideal: IdealProfile;
  videoUrl?: string | null;
}): RoleWithReels {
  return {
    id: args.id,
    organizationId: DEMO_ORG_ID,
    title: args.title,
    location: args.location,
    description: args.description,
    mosFitTags: null,
    idealProfile: args.ideal as unknown as Prisma.JsonValue,
    createdAt: now,
    updatedAt: now,
    reels: [demoReel(args.id, args.title, args.videoUrl ?? null)],
  };
}

const opsIdeal: IdealProfile = {
  skillsExperience: {
    translatedSkills: [
      'Operations leadership',
      'Team management',
      'Logistics & supply',
      'Safety compliance',
      'Process improvement',
    ],
  },
  personality: {
    extraversion: 58,
    conscientiousness: 88,
    openness: 55,
    agreeableness: 64,
    emotionalStability: 82,
  },
  resilienceDrive: { gritScore: 85 },
  emotionalIntelligence: { selfAwareness: 72, empathy: 70, interpersonalSkill: 80 },
  motivationValues: { coreValues: ['Ownership', 'Service', 'Team welfare', 'Excellence'] },
  weights: {
    skillsExperience: 70,
    personality: 55,
    resilienceDrive: 85,
    emotionalIntelligence: 75,
    motivationValues: 70,
  },
};

const techIdeal: IdealProfile = {
  skillsExperience: {
    translatedSkills: ['Technical troubleshooting', 'Field maintenance', 'Independent problem-solving', 'Customer-facing repair'],
  },
  personality: {
    extraversion: 45,
    conscientiousness: 85,
    openness: 60,
    agreeableness: 58,
    emotionalStability: 78,
  },
  resilienceDrive: { gritScore: 80 },
  emotionalIntelligence: { selfAwareness: 60, empathy: 55, interpersonalSkill: 62 },
  motivationValues: { coreValues: ['Craftsmanship', 'Autonomy', 'Reliability'] },
  weights: { skillsExperience: 85, personality: 45, resilienceDrive: 70, emotionalIntelligence: 40, motivationValues: 55 },
};

const csmIdeal: IdealProfile = {
  skillsExperience: {
    translatedSkills: ['Relationship management', 'Communication', 'Organization', 'Onboarding', 'Account ownership'],
  },
  personality: {
    extraversion: 72,
    conscientiousness: 80,
    openness: 62,
    agreeableness: 78,
    emotionalStability: 75,
  },
  resilienceDrive: { gritScore: 72 },
  emotionalIntelligence: { selfAwareness: 80, empathy: 85, interpersonalSkill: 88 },
  motivationValues: { coreValues: ['Trust', 'Service', 'Follow-through', 'Mission'] },
  weights: { skillsExperience: 55, personality: 70, resilienceDrive: 60, emotionalIntelligence: 85, motivationValues: 70 },
};

const DEMO_ROLE_ROWS: RoleWithReels[] = [
  demoRoleRow({
    id: 'demo-role-ops',
    title: 'Regional Operations Lead',
    location: 'Columbus, OH',
    description:
      "You'll own daily operations for a 60-person distribution hub — staffing, safety, throughput, and the people who make it run. We care less about your degree and more about whether you've led a team through a hard day and come out the other side. Veterans thrive here: the work rewards ownership, calm under pressure, and taking care of your people. Real growth path to site director.",
    ideal: opsIdeal,
    videoUrl: 'https://stream.demo/ridgeline-ops',
  }),
  demoRoleRow({
    id: 'demo-role-tech',
    title: 'Field Service Technician',
    location: 'Remote / regional travel',
    description:
      'Install, troubleshoot, and maintain energy systems across a regional territory. You set your route, you solve the problem, you move on. Strong fit for anyone who ran maintenance or technical operations in service — we translate that experience and we train the rest. Company vehicle, tools, and certifications provided.',
    ideal: techIdeal,
    videoUrl: null,
  }),
  demoRoleRow({
    id: 'demo-role-csm',
    title: 'Customer Success Manager',
    location: 'Austin, TX (hybrid)',
    description:
      "You'll own a book of healthcare customers — onboarding them, earning their trust, and making sure they get real value. The best people in this role read a room, stay organized, and do what they say they'll do. No sales background required; we've found people who led others and cared about the mission pick this up fast.",
    ideal: csmIdeal,
    videoUrl: null,
  }),
];

export function demoRoles(): RoleWithReels[] {
  return DEMO_ROLE_ROWS;
}

export function demoRole(id: string): RoleWithReels | null {
  return DEMO_ROLE_ROWS.find((r) => r.id === id) ?? DEMO_ROLE_ROWS[0] ?? null;
}

// ── The Fit Read — suggested people for a role ───────────────────────────────

function decoded(d: DecodedCredibility): DecodedCredibility {
  return d;
}

function breakdown(b: FitBreakdown): FitBreakdown {
  return b;
}

const DEMO_MATCHES: SuggestedMatch[] = [
  {
    matchId: 'demo-match-marcus',
    candidate: {
      candidateId: 'demo-cand-marcus',
      displayName: 'marcus',
      headline: 'Operations leader who ran a 45-person logistics platoon',
      hometown: 'Columbus, OH',
      currentLocation: 'Columbus, OH',
      mosTranslation:
        'Led 45 people and accountability for millions in equipment; ran daily logistics under real pressure.',
      decoded: decoded({
        headline: 'Proven operations leader — 45 people, multi-million-dollar accountability',
        businessSummary:
          'Spent eight years leading logistics operations, finishing as the senior NCO responsible for a 45-person section and the equipment, safety, and readiness that came with it. Repeatedly took over struggling sections and turned throughput and morale around — the exact shape of running a distribution floor.',
        proofSignals: [
          'Led 45 people',
          'Accountable for $12M in equipment',
          'Promoted ahead of peers',
          'Zero safety incidents over 2 years',
        ],
        valuesFit:
          'Driven by ownership and taking care of the people under him — wants a place where the floor runs because he made it run.',
      }),
      completenessScore: 92,
    },
    breakdown: breakdown({
      dimensionScores: {
        skillsExperience: 88,
        personality: 90,
        resilienceDrive: 96,
        emotionalIntelligence: 89,
        motivationValues: 95,
      },
      overall: 91,
      plainLanguageWhy:
        "Marcus is almost exactly who this role is built for: he has led a team of this size through hard days, he is accountable by instinct, and his values — ownership, service, looking after his people — line up cleanly with how Ridgeline runs its floor.",
      honestGaps: [
        'No formal warehouse-management-software experience yet — fast to learn, but worth covering in week one.',
      ],
    }),
    tier: fitTier(91),
    status: 'suggested',
  },
  {
    matchId: 'demo-match-dana',
    candidate: {
      candidateId: 'demo-cand-dana',
      displayName: 'dana',
      headline: 'Maintenance chief turned operations generalist',
      hometown: 'Dayton, OH',
      currentLocation: 'Cincinnati, OH',
      mosTranslation:
        'Ran a maintenance shop of 20; strong on process and safety, growing into people leadership.',
      decoded: decoded({
        headline: 'Process-strong operations builder with a maintenance backbone',
        businessSummary:
          'Built and ran a 20-person maintenance operation, known for tightening process and never missing a safety mark. Now moving from technical leadership into broader operations — hungry for the step up this role offers.',
        proofSignals: ['Led 20 people', 'Built the shop SOPs still in use', 'Cut downtime 30%'],
        valuesFit: 'Motivated by craftsmanship and reliability; wants ownership of an operation end-to-end.',
      }),
      completenessScore: 84,
    },
    breakdown: breakdown({
      dimensionScores: {
        skillsExperience: 76,
        personality: 78,
        resilienceDrive: 82,
        emotionalIntelligence: 70,
        motivationValues: 80,
      },
      overall: 78,
      plainLanguageWhy:
        "Dana brings real process discipline and a safety-first instinct that fits a distribution floor well. The leadership scope is a notch below the role's target, but the trajectory is pointed straight at it.",
      honestGaps: [
        'Has led 20, not 45 — this would be a real step up in span of control.',
        'Less customer/stakeholder-facing experience than the role occasionally needs.',
      ],
    }),
    tier: fitTier(78),
    status: 'invited',
  },
  {
    matchId: 'demo-match-reuben',
    candidate: {
      candidateId: 'demo-cand-reuben',
      displayName: 'reuben',
      headline: 'Squad leader, early in his civilian transition',
      hometown: 'Columbus, OH',
      currentLocation: 'Columbus, OH',
      mosTranslation: 'Led an 8-person squad; strong drive and team instincts, building civilian-facing experience.',
      decoded: decoded({
        headline: 'High-drive emerging leader with deep roots in the region',
        businessSummary:
          'Led an eight-person squad and consistently the one others turned to when things got hard. Early in his transition, so the resume is thin, but the raw leadership and grit are unmistakable — and he is local.',
        proofSignals: ['Led 8 people', 'Meritorious promotion', 'Local to Columbus'],
        valuesFit: 'Wants to stay near home and build something — relatedness and growth matter most.',
      }),
      completenessScore: 67,
    },
    breakdown: breakdown({
      dimensionScores: {
        skillsExperience: 52,
        personality: 74,
        resilienceDrive: 88,
        emotionalIntelligence: 66,
        motivationValues: 78,
      },
      overall: 63,
      plainLanguageWhy:
        "Reuben is a promising bet rather than a plug-and-play hire: the drive and the team instincts are there, and his roots in Columbus make him likely to stay. He'd need development on the operations side, but the foundation is strong.",
      honestGaps: [
        'Smaller leadership span so far (8 vs 45).',
        'Still translating service experience into operations specifics — would need a ramp.',
      ],
    }),
    tier: fitTier(63),
    status: 'suggested',
  },
];

/** Suggested people for any role (demo returns the same believable slate). */
export function demoMatches(): SuggestedMatch[] {
  return DEMO_MATCHES;
}

// ── Insights (Employer Dashboard 6.1) ────────────────────────────────────────

export function demoEmployerDashboard(): EmployerDashboard {
  return {
    openRoles: DEMO_ROLE_ROWS.length,
    candidatesSurfaced: 23,
    reachedOut: 6,
    connected: 2,
    tokensLeft: DEMO_INVITE_BALANCE,
    tokensSpentThisMonth: 20 - DEMO_INVITE_BALANCE,
    recent: [
      { candidate: 'Maintenance chief turned operations generalist', roleTitle: 'Regional Operations Lead', at: now.toISOString() },
      { candidate: 'Logistics planner, 6 yrs', roleTitle: 'Regional Operations Lead', at: now.toISOString() },
      { candidate: 'Comms NCO → customer success', roleTitle: 'Customer Success Manager', at: now.toISOString() },
    ],
  };
}

// ── The Veteran's Own View (6.2) ─────────────────────────────────────────────

export function demoCandidateDashboard(): CandidateDashboard {
  // Marcus at his strongest: foundation done, video ready, assessment taken — a Standout.
  const strength = computeProfileStrength({
    foundationComplete: true,
    videoStatus: 'ready',
    assessmentComplete: true,
  });
  return {
    candidateId: 'demo-cand-marcus',
    completenessScore: strength.score,
    strength,
    interestedCount: 2,
    interested: [
      { organizationName: 'Ridgeline Logistics', roleTitle: 'Regional Operations Lead' },
      { organizationName: 'Summit Energy', roleTitle: 'Field Service Technician' },
    ],
    savedPaths: 2,
    openPaths: 3,
    hasIntroVideo: true,
    hasAssessment: true,
  };
}

// ── Candidate-side Fit Read (2.2, Dana's view) ───────────────────────────────

export function demoCandidateFitReads(): import('./candidate-matches').CandidateFitRead[] {
  return [
    {
      roleId: 'demo-role-ops',
      roleTitle: 'Regional Operations Lead',
      company: 'Ridgeline Logistics',
      location: 'Columbus, OH',
      overall: 91,
      tier: fitTier(91),
      why: 'A strong match on Resilience & Drive and Motivation & Values.',
      gap: null,
    },
    {
      roleId: 'demo-role-csm',
      roleTitle: 'Customer Success Manager',
      company: 'Beacon Health',
      location: 'Austin, TX (hybrid)',
      overall: 74,
      tier: fitTier(74),
      why: 'A strong match on Emotional Intelligence.',
      gap: 'Room to grow on Skills & Experience.',
    },
    {
      roleId: 'demo-role-tech',
      roleTitle: 'Field Service Technician',
      company: 'Summit Energy',
      location: 'Remote / regional travel',
      overall: 63,
      tier: fitTier(63),
      why: 'Worth a look based on the whole of who you are.',
      gap: 'Room to grow on Skills & Experience.',
    },
  ];
}

// ── People search (Come Home 3.3) ────────────────────────────────────────────

const DEMO_PEOPLE: PeopleSearchResult[] = [
  {
    candidateId: 'demo-cand-marcus',
    displayName: 'marcus',
    headline: 'Operations leader who ran a 45-person logistics platoon',
    currentLocation: 'Columbus, OH',
    roots: [
      { place: 'Columbus, OH', isPrimary: true },
      { place: 'Lancaster, OH', isPrimary: false },
    ],
    decodedSummary:
      'Led 45 people and millions in equipment; ran daily logistics under pressure. Built to run a distribution floor.',
    completenessScore: 92,
  },
  {
    candidateId: 'demo-cand-reuben',
    displayName: 'reuben',
    headline: 'Squad leader, early in his civilian transition',
    currentLocation: 'Columbus, OH',
    roots: [{ place: 'Columbus, OH', isPrimary: true }],
    decodedSummary: 'High-drive emerging leader, local to Columbus and looking to stay and build.',
    completenessScore: 67,
  },
  {
    candidateId: 'demo-cand-dana',
    displayName: 'dana',
    headline: 'Maintenance chief turned operations generalist',
    currentLocation: 'Cincinnati, OH',
    roots: [{ place: 'Dayton, OH', isPrimary: true }],
    decodedSummary: 'Process-strong operations builder with a maintenance backbone; cut downtime 30%.',
    completenessScore: 84,
  },
];

/** Demo people search honours the keyword/place filter so the search feels real. */
export function demoPeople(input: { query?: string | null; place?: string | null }): PeopleSearchResult[] {
  const q = input.query?.trim().toLowerCase();
  const p = input.place?.trim().toLowerCase();
  return DEMO_PEOPLE.filter((person) => {
    const matchesQ =
      !q ||
      (person.headline ?? '').toLowerCase().includes(q) ||
      (person.decodedSummary ?? '').toLowerCase().includes(q);
    const matchesP =
      !p ||
      (person.currentLocation ?? '').toLowerCase().includes(p) ||
      person.roots.some((r) => r.place.toLowerCase().includes(p));
    return matchesQ && matchesP;
  });
}

// ── Champions (8.1) ──────────────────────────────────────────────────────────

export function demoChampions(): ChampionView[] {
  return [
    {
      advocateId: 'demo-champ-liberty',
      email: 'tap.counselor@us.army.mil',
      officeName: 'Fort Liberty TAP Center',
      code: 'demo-liberty',
      referred: 9,
    },
    {
      advocateId: 'demo-champ-uso',
      email: 'transition@uso.org',
      officeName: 'USO Pathfinder — Columbus',
      code: 'demo-uso-cmh',
      referred: 4,
    },
  ];
}

// ── Alerts (3.4) ─────────────────────────────────────────────────────────────

export function demoAlerts(): AlertView[] {
  return [
    { id: 'demo-alert-ops', label: 'Ohio operations leaders', keyword: 'operations', place: 'OH', newCount: 3 },
    { id: 'demo-alert-tech', label: 'Field technicians', keyword: 'maintenance', place: null, newCount: 0 },
  ];
}

// ── Story Studio (5.1) ───────────────────────────────────────────────────────

export function demoStudioReels(): StudioReelView[] {
  return [
    {
      id: 'demo-reel-floor',
      themeId: 'day-in-the-life',
      title: 'A day on our logistics floor',
      caption: 'The shift starts before sunrise — and so does the team that owns it.',
      videoUrl: 'https://stream.demo/ridgeline-floor',
      createdAt: now.toISOString(),
    },
    {
      id: 'demo-reel-why',
      themeId: 'why-we-hire-vets',
      title: 'Why we plant our flag for veterans',
      caption: 'We hire the ones who served because the work rewards exactly what the service builds.',
      videoUrl: null,
      createdAt: now.toISOString(),
    },
  ];
}
