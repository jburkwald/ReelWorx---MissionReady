# ReelWorx NextMission

A human-connection platform for veterans, civilians, and the companies who want to hire them — story and science instead of resumes and keywords.

## Start here

1. Read `CLAUDE.md` — the fastest orientation to the whole project (read automatically by Claude Code).
2. Read `/docs/VISION_AND_BACKLOG.md` for the full product vision, personas, and Epic/Feature backlog.
3. Read `/docs/DATA_MODEL.md`, `/docs/DESIGN_LANGUAGE.md`, and `/docs/BEHAVIORAL_DESIGN.md` before writing product code.
4. `cp .env.example .env` and fill in the keys below.
5. `npm install` at the root, then run an app (see **Running the apps**).
6. To publish + test against real services, follow [`/docs/DEPLOY.md`](docs/DEPLOY.md).

## Structure

```
reelworx-nextmission/
├── CLAUDE.md                       ← read first, always current
├── docs/                           ← vision, data model, design + behavioral references
├── apps/
│   ├── mobile/                     ← Expo / React Native — candidate experience (Marcus)
│   └── web/                        ← Next.js (App Router) — company experience (Karen)
└── packages/
    └── shared/                     ← one backend brain for both apps
        ├── prisma/schema.prisma    ← data model (Prisma 7)
        ├── prisma.config.ts        ← Prisma 7 CLI config (pg driver adapter)
        └── src/
            ├── index.ts            ← ISOMORPHIC entry (safe for web + mobile)
            ├── server/             ← SERVER-ONLY entry (Prisma, Mux, Anthropic) — never in mobile
            ├── theme/tokens.ts     ← design tokens (Apple structure + Wrapped energy)
            ├── types/fit.ts        ← the five-dimension fit model shape
            ├── fit/score.ts        ← deterministic Fit Read core
            └── brand.ts            ← the one place the "Full Spectrum" brand string lives
```

## The one rule that protects everything else

Veterans/civilians get a **mobile-first** experience; companies get a **web-first** experience. Both run on the same data model and business logic in `packages/shared` — **only the UI layer forks.** The mobile app never imports `@reelworx/shared/server` (no Prisma in the RN bundle); it reaches the backend over HTTP.

## Environment keys

Copy `.env.example` → `.env`. To see **auth run end-to-end**, only the Clerk keys are required; the rest unlock later features.

| Key | Needed for | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Web auth | Clerk dashboard → API keys |
| `CLERK_SECRET_KEY` | Web auth (server) | Clerk dashboard → API keys |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Mobile auth | Clerk dashboard → API keys (same publishable key) |
| `DATABASE_URL` | Prisma / DB (data-primitives phase) | Supabase → Project → Connection string |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Image uploads | Supabase → Project settings → API |
| `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET` | Video upload/playback | Mux dashboard → Settings → Access Tokens |
| `ANTHROPIC_API_KEY` | Onboarding agent, Fit Read narration | console.anthropic.com |

> Clerk role note: the web app assigns `company_admin` on first sign-in (a "Plant your flag" action). The mobile app is the candidate side. Role is stored on Clerk `publicMetadata.role` for now; DB user provisioning lands in the data-primitives phase.

## Running the apps

```bash
# Web (company side) — http://localhost:3000
npm run dev --workspace=@reelworx/web

# Mobile (candidate side) — opens Expo; scan the QR with Expo Go or run a simulator
npm run dev --workspace=@reelworx/mobile

# Shared / database
npm run db:generate     # regenerate the Prisma client
npm run db:push         # push schema to the database (needs DATABASE_URL)
npm run db:studio       # browse data
```

Quality gates (all currently green):

```bash
npm run typecheck       # all three workspaces (TypeScript 6)
npm run build --workspace=@reelworx/web     # Next.js production build
( cd apps/mobile && npx expo-doctor )       # 21/21 checks
```

## Stack

Turborepo + npm workspaces · Next.js 16 (React 19) · Expo SDK 56 / React Native 0.85 (expo-router) · Clerk 7 auth · Prisma 7 + Postgres (Supabase) via the `pg` driver adapter · Mux video + Supabase Storage images · Anthropic (Claude) for the agent and narration · TypeScript 6.

> `.npmrc` sets `legacy-peer-deps=true` and the root `package.json` pins React to a single version (`overrides`) because the stack runs the latest majors, where some peer ranges trail. Revisit as the ecosystem catches up.
