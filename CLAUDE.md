# ReelWorx NextMission — Project Memory for Claude Code

This file is read automatically at the start of every Claude Code session in this repo. Keep it current. If a decision changes, update this file in the same session.

## What this project is

A two-sided human-connection platform. Veterans and civilians build a story-driven profile (video + a values/personality read) instead of a resume. Companies post story-driven job content instead of bullet-point listings. The two sides find each other through a science-backed fit read, not keyword search.

Veterans are the primary persona and the platform must be mobile-first for them. Companies are web-first. Full context on the why is in `/docs/VISION.md` and `/docs/BACKLOG.md` — read both before generating product code, not just this file.

## Platform split (this is a hard requirement, not a preference)

- **Veteran / civilian candidate experience → mobile app.** This is how Marcus (the hero persona) lives his life. Build mobile-first, mobile-native feel, not a responsive web page in a wrapper.
- **Company / employer experience → web app.** Karen (the hiring leader) works from a desktop. Dashboards, search, and reporting belong on the web.
- Both consume the same backend and the same data model. Do not fork business logic between them. Fork only the UI layer.

## Design language (non-negotiable, read before writing any UI code)

Two references, blended, not picked one-or-the-other:

1. **Apple's design language** for structure, typography, motion, and restraint. Generous whitespace, SF Pro–style type hierarchy (use the system font stack, do not pull licensed Apple fonts), calm color use, native-feeling interaction patterns, haptics-aware motion on mobile. This governs *how things feel to use*.
2. **Spotify Wrapped** for color, energy, and iconography. Bold gradient color blocks, the ReelWorx rainbow-spectrum palette on black, oversized confident type for key stats and moments, playful but purposeful motion when something worth celebrating happens (a match, a profile-strength milestone, a hire). This governs *moments of delight and brand personality*, layered on top of the Apple-grade structural calm. It does not mean loud everywhere. It means loud exactly where it should be — a match reveal, a profile strength jump, a "you're hired" moment — and quiet everywhere else.

Full design tokens belong in `packages/shared/src/theme/`. Before writing UI, also read the `frontend-design` skill if running in an environment that has it.

## Behavioral science is a design requirement, not a feature

Every profile, listing, and matching surface should be built with deliberate behavioral design, not default app patterns. Specifically:

- **Signaling theory** → tokens make outreach costly and therefore meaningful. Never make application or invite infinite.
- **Self-Determination Theory (autonomy, competence, relatedness)** → profile strength meters, visible progress, the person's own choices driving outreach, not algorithmic pressure.
- **Realistic job preview research** → video-first listings reduce bad-fit churn; never let a text-only listing be the default.
- **Progress and completion bias** → profile building uses visible progress, milestone moments, and gentle re-engagement, never guilt-based nags.
- **Variable, earned celebration** → Spotify Wrapped energy gets used at genuine milestones (profile strength jump, new match, application sent, hire) so it stays meaningful instead of decorative.

Reference `/docs/BACKLOG.md` Part 6, "Quantum Leap Principles," before building anything: Signal over volume, Story over specification, Owned over rented, Assembly not generation, Earn the expansion, Data is the flywheel. Any feature that violates one of these should be flagged, not silently built.

## Tech stack (confirm before deviating)

- Monorepo via Turborepo, npm workspaces.
- Mobile: React Native + Expo.
- Web: Next.js (App Router).
- Shared: TypeScript types, the Full Spectrum scoring logic, API client, design tokens — all in `packages/shared`.
- Auth: Clerk (supports both web and mobile, role-based: candidate / company_admin / admin).
- Database: Postgres via Supabase, Prisma as the ORM.
- Payments: Stripe (tokens, subscriptions). Stripe Connect deferred — no payouts in MVP.
- AI: Anthropic API (Claude) for the onboarding agent, fit-read narration, decoded-credibility copy, and path discovery reasoning.
- Video: Mux or Cloudinary for upload/playback (confirm with team before MVP; not yet decided — see open decisions in `/docs/BACKLOG.md`).
- Hosting: Vercel (web), EAS (Expo Application Services) for mobile builds.

## Build order

Build the MVP feature list in `/docs/BACKLOG.md` Part 5 in this order, because each phase unblocks the next: (1) auth + the six core data primitives, (2) candidate Story Profile build flow on mobile, (3) company profile + job listing on web, (4) the Fit Read / matching engine, (5) tokens and intentful reach, (6) the employer dashboard, (7) advocacy sharing + tracking, (8) the Champion on-ramp.

Do not build Release 2 or Horizon features (certification marketplace, payouts, predictive insight, configurable verticals) during MVP work. They are documented so the data model does not block them later, not because they should be coded now.

## Working agreement

- This is meant to stay emergent, not rigid. If a technical choice above conflicts with something in `/docs/VISION.md` or `/docs/BACKLOG.md`, the vision and backlog win — flag the conflict and propose an alternative rather than silently following the stack notes.
- Ask before introducing a new top-level dependency or service not listed above.
- Use the personas by name (Marcus, Karen, the Placed Veteran, the Veteran Champion) in code comments and commit messages where it clarifies intent — it keeps the human center of this project visible in the codebase itself.
