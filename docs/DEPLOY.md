# Deploying ReelWorx MissionReady

The **web (company) app** deploys to Vercel and is testable immediately. The **mobile
(candidate) app** needs an EAS dev-client build (it uses native modules — `expo-image-picker`,
`expo-video` — so it can't run in Expo Go). Start with the web app.

---

## 1. Provision the services

You need accounts + keys from four services. Everything else in `.env.example` (Stripe,
ElevenLabs, SimpleTexting/Beehiiv, Supabase **Storage** keys) is for features that aren't
built yet — leave them blank.

| Service | What to grab | Where |
|---|---|---|
| **Supabase** (Postgres) | the **connection string** (NOT the API key) | Project → Settings → Database → Connection string |
| **Clerk** | publishable + secret keys | Clerk dashboard → API keys |
| **Anthropic** | API key | console.anthropic.com → API keys |
| **Mux** (optional, video only) | token id + secret | Mux dashboard → Settings → API Access Tokens |

> **Supabase has two connection strings.** Use the **Direct** one (port `5432`) for
> `db:push`/migrations, and the **Transaction pooler** one (port `6543`, Supavisor) for the
> deployed serverless runtime. To start, the Direct string works for both.

---

## 2. Create the database schema

No migration has ever run against a real DB, so the first push creates the **entire**
schema (including the four most recent fields: `Profile.decodedCredibility`, the `Alert`
model, `PathSuggestion.detail`, `Reel.caption`).

```bash
# Put DATABASE_URL in packages/shared/.env (NOT the repo root — the Prisma CLI + seed run
# from packages/shared and load .env from there). Use the Supabase DIRECT string (port 5432).
#   packages/shared/.env →  DATABASE_URL="postgresql://...:5432/postgres"
npm run db:push
```

`db:generate` runs automatically on `npm install` (postinstall), so the Prisma client is
always present — no manual generate step.

### Seed demo candidates (recommended)
So the company-side Fit Read has people to rank on day one:

```bash
npm run db:seed   # idempotent — 5 demo candidates with full fit profiles + decoded reads
```

These carry complete five-dimension data and a cached decoded credibility, so matches score
and render meaningfully **even before** `ANTHROPIC_API_KEY` is set. Two share roots in
Columbus, OH — handy for demoing the "Come Home" search.

---

## 3. Environment variables (Vercel project → Settings → Environment Variables)

The web app needs only these. (The `EXPO_PUBLIC_*` vars are for the **mobile** build, set in
EAS — not Vercel.)

```
DATABASE_URL                          # Supabase — pooler (6543) for runtime
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
ANTHROPIC_API_KEY
MUX_TOKEN_ID                          # optional (intro video)
MUX_TOKEN_SECRET                      # optional (intro video)
NEXT_PUBLIC_WEB_URL                   # your deployed URL, e.g. https://reelworx.vercel.app
```

---

## 4. Deploy the web app to Vercel

1. **Import the repo** into Vercel.
2. Set **Root Directory = `apps/web`**. This is the only required dashboard setting — Vercel
   then treats it as a native Next.js project (full functions/ISR/image support) and installs
   from the monorepo root, so the workspace `postinstall` (Prisma generate) runs.
   `apps/web/vercel.json` declares the framework so detection is unambiguous.
3. Add the environment variables from step 3.
4. Deploy.

> If Vercel ever installs only inside `apps/web` (missing workspace deps), set the project's
> **Install Command** to `npm install --workspaces --include-workspace-root` at the repo root,
> or keep Root Directory at the repo root and set Build Command to
> `npm run build --workspace=apps/web` with Output Directory `apps/web/.next`. The Root-Directory
> approach above is preferred.

### After the first deploy
- Set `NEXT_PUBLIC_WEB_URL` to the real deployed URL and redeploy.
- In Clerk, add the deployed domain to the allowed origins / set the production instance.

---

## 5. Smoke-test the company loop (web only)

With `DATABASE_URL` + Clerk + Anthropic set:

1. Sign up → you land on the dashboard.
2. **Plant your flag** (create the organization).
3. **Create a role** — the AI derives its ideal Full Spectrum profile.
4. **Run the Fit Read** on the role — candidates are scored, decoded, and ranked.
5. **Reach out** — spends an invite token and flips the match to *invited*.

(Steps 3–4 need `ANTHROPIC_API_KEY`; everything else needs only DB + Clerk.)

If you ran `npm run db:seed`, five demo candidates are already there to rank. Otherwise,
create one by signing in to the mobile app (step 6) or seed directly.

---

## 6. Mobile (candidate) app — EAS

The candidate app **cannot run in Expo Go** (native modules). Build a dev client:

```bash
cd apps/mobile
# set EXPO_PUBLIC_API_URL to the deployed web /api, and EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
npx eas build --profile development --platform ios   # or android
```

Then run `npx expo start --dev-client` and open the build on a device.

---

## Not needed yet (deferred features)
Supabase **Storage** keys (no image upload surface), **Stripe** (token top-ups deferred),
**ElevenLabs** (audio), **SimpleTexting/Beehiiv** (the weekly digest *send* — the digest
content builder exists; only delivery is deferred).
