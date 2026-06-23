# ReelWorx NextMission

A human-connection platform for veterans, civilians, and the companies who want to hire them — story and science instead of resumes and keywords.

## Start here

1. Read `CLAUDE.md` — this is what Claude Code reads automatically, and it's the fastest orientation to the whole project.
2. Read `/docs/VISION_AND_BACKLOG.md` for the full product vision, personas, and Epic/Feature backlog.
3. Read `/docs/DATA_MODEL.md`, `/docs/DESIGN_LANGUAGE.md`, and `/docs/BEHAVIORAL_DESIGN.md` before writing product code.
4. Copy `.env.example` to `.env` and fill in real credentials before running anything.
5. Run `npm install` at the root, then `npm run dev` to start both apps via Turborepo.

## Structure

```
reelworx-nextmission/
├── CLAUDE.md                  ← read first, always current
├── docs/
│   ├── VISION_AND_BACKLOG.md  ← the full product vision + Epics/Features/stories
│   ├── DATA_MODEL.md          ← the six primitives + ERAP layer, draft schema rationale
│   ├── DESIGN_LANGUAGE.md     ← Apple structure + Spotify Wrapped energy, concrete tokens
│   └── BEHAVIORAL_DESIGN.md   ← the behavioral science principles and where each applies
├── apps/
│   ├── mobile/                ← Expo/React Native — the veteran/civilian candidate experience
│   └── web/                   ← Next.js — the company/employer experience
└── packages/
    └── shared/                ← Prisma schema, shared types, theme tokens, consumed by both apps
        └── prisma/schema.prisma
```

## The one rule that protects everything else

Veterans and civilians get a mobile-first experience. Companies get a web-first experience. Both run on the same data model and the same business logic in `packages/shared` — only the UI layer forks. Don't duplicate logic between the two apps.
