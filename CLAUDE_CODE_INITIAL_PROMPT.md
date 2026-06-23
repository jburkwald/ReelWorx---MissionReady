# Initial Prompt for Claude Code

Paste everything below into Claude Code once you've opened this project folder. It has already read `CLAUDE.md` automatically — this prompt gives it the kickoff task and the additional framing that belongs in a conversation, not in project memory.

---

I'm building ReelWorx NextMission, a two-sided human-connection platform that helps veterans and civilians find meaningful careers through story and a science-backed fit read, instead of resumes and keyword search, and helps companies find them the same way.

You've already read `CLAUDE.md`. Before you write any code, also read `/docs/VISION_AND_BACKLOG.md` in full, then `/docs/DATA_MODEL.md`, `/docs/DESIGN_LANGUAGE.md`, and `/docs/BEHAVIORAL_DESIGN.md`. I want you to actually internalize the vision, not just skim for technical requirements — the backlog document explains *why* the platform is built the way it is, and that reasoning should shape decisions you make that I haven't explicitly specified.

## The split that matters most

This has to be two real applications sharing one backend, not one responsive app pretending to be two things:

- **Mobile app (Expo / React Native), in `apps/mobile`** — this is the experience for veterans and civilians, our primary persona. It needs to feel like a native app a person would actually want on their phone, not a web page in a wrapper. Think about how Marcus (the hero persona in the backlog doc) lives his life: on his phone, in spare moments, possibly anxious about what's next. Build for that.
- **Web app (Next.js), in `apps/web`** — this is the experience for companies and hiring leaders (Karen, in the backlog doc). She's at a desk, she wants dashboards, search, and clarity, and she needs to trust the signal she's seeing.

Both consume the same Prisma schema and shared types in `packages/shared`. Do not fork business logic. Fork the UI layer only.

## Design language: Apple structure, Spotify Wrapped energy

I want this designed like Apple builds interfaces — calm, native-feeling, generous whitespace, clear typographic hierarchy, physics-based motion, restraint — and I want it to use Spotify Wrapped's visual language for color and for the moments that deserve celebration: bold spectrum-gradient color blocks, oversized confident type, a real sense of energy when something worth marking happens (a new match, a profile-strength milestone, getting hired).

These aren't competing directions, they're layered: Apple governs how the app feels to navigate day to day, Wrapped governs how it feels in the handful of moments that matter. Read `/docs/DESIGN_LANGUAGE.md` for the starting design tokens — treat them as a strong first draft, refine as you build, but keep the underlying philosophy intact. Please don't default to generic app patterns (default Tailwind look, default Expo starter look) without deliberately applying this design language on top.

## Behavioral science is part of the spec, not a feature

Every profile-building flow, every job listing, every matching surface should be built with intent, grounded in the principles in `/docs/BEHAVIORAL_DESIGN.md`: signaling theory behind the token system, self-determination theory behind how the Story Profile build flow feels, realistic-job-preview research behind defaulting every listing to video-first, progress/completion bias behind how profile-building momentum is shown, and real restraint around celebration so it stays meaningful. If you're about to build something because "that's just what apps do" rather than because it serves the person using it, flag it to me instead of building it by default.

## What I want from you right now

1. Confirm you've read the four docs and give me a brief summary of your understanding of the vision in your own words, so I can correct anything before code gets written.
2. Propose the actual Prisma schema based on the draft in `packages/shared/prisma/schema.prisma` — tell me if the implementation reveals a better shape than what's there, but preserve the discipline of keeping Reel/Cast/etc. generic and vertical-agnostic.
3. Scaffold both apps (Expo in `apps/mobile`, Next.js App Router in `apps/web`), wired to the shared package, with auth (Clerk) working end to end on both before building any feature screens.
4. Then work through the MVP feature list in `/docs/VISION_AND_BACKLOG.md` Part 5 in the build order specified in `CLAUDE.md`: data primitives and auth first, then the candidate Story Profile build flow on mobile, then the company profile and job listing on web, then the Fit Read / matching engine, then tokens, then the employer dashboard, then advocacy sharing, then the Champion on-ramp.

Ask me clarifying questions before making a significant architectural decision I haven't covered, especially around the open decisions listed in the backlog doc's final section (candidate profile visibility, Full Spectrum naming, video hosting choice). Don't guess silently on those — they have real downstream consequences and I'd rather answer a question now than redo work later.

Let's start with step 1 and step 2 above before touching app code.
