# ReelWorx NextMission — Full Test Setup & Persona Script

How to take the app from the keyless demo to a real, end-to-end test of every persona.
The features are built; this is configuration + first real run.

---

## 1. The keys (one file: `apps/web/.env.local`)

Everything the real (non-demo) paths call:

| Key | Unlocks | Required for |
|---|---|---|
| `DATABASE_URL` (Supabase Postgres) | All persistence; the master demo→real switch | Everything real |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` | Real sign-in (candidate + company) | Karen, real Marcus |
| `ANTHROPIC_API_KEY` (starts `sk-ant-`) | The real Story agent + Fit Read + decoding + paths + resume parse | Smart agent, AI narration |
| `MUX_TOKEN_ID` + `MUX_TOKEN_SECRET` | Intro video upload + playback (Feature 1.4) | Marcus's video |
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | Profile photo / image uploads | Profile images |
| `ELEVENLABS_API_KEY` | HD voice (TTS) + transcription (STT) | Voice mode (optional) |

Model IDs in `packages/shared/src/server/ai.ts` are current and valid
(`claude-opus-4-8`, `claude-sonnet-4-6`, `claude-haiku-4-5`) — no change needed; any
standard Anthropic account has access.

After setting `DATABASE_URL` (and from the repo root):

```bash
npm run db:push     # materialize the schema (no committed migration yet)
npm run db:seed     # demo candidates so Karen's Fit Read has people to rank
npm run dev --workspace=apps/web   # restart so env loads
```

Confirm: `http://localhost:3000/api/voice/status` → `{"provider":"elevenlabs",...}` once the
ElevenLabs key is set; `/dashboard` should now ask you to sign in (real auth) instead of
opening the demo workspace.

---

## 2. Run the mobile app (the candidate side is mobile-first)

The candidate experience has only ever run on the web demo. To exercise it for real:

```bash
npm run dev --workspace=apps/mobile     # Expo
```

- Set `EXPO_PUBLIC_API_URL` to your machine's LAN IP (e.g. `http://192.168.1.98:3000/api`),
  not `localhost`, so a phone/simulator can reach the web API.
- Set `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`.
- Open in Expo Go or a simulator; approve mic (voice) and camera (video) permissions.
- This is the biggest unknown — mobile is typecheck-clean but never device-run.

---

## 3. Persona test script

### Marcus (transitioning, mobile)
1. Sign up as a candidate.
2. Build the Story Profile → pick **Voice**, **Text**, or **Upload a resume**.
   - Phase 1 "Your record": tap-select branch / rank / time / status / roots.
   - Phase 2 "Your story": the agent draws out the why (real Claude with the key).
   - Watch **Profile strength** climb to 35 (Visible) when the foundation lands.
3. Record the **60-second intro video** (needs Mux) → strength → 65.
4. Take the **Full Spectrum read** → strength → 90 (Standout).
5. **Discover paths** (2.1) and **See companies that fit you** (2.2) → Reach out (spends a token).
6. Add a **Living Profile chapter** (1.6).

### Karen (company, web)
1. Sign up as a company; **plant your flag**.
2. **Create a role** → AI derives its Full Spectrum target.
3. **Run the Fit Read** → Marcus + seeded demos ranked, decoded, with honest gaps.
4. **Reach out** (spends an invite token, Match → invited).
5. **Find people** by keyword + hometown roots; set an **alert**; open **Insights**.
6. **Champions**: register an office → a printable **QR** + invite link appears.
7. **Story Studio**: assemble a Reel from a theme.

### Dana (veteran out, wants recruiting)
- On mobile: **See companies that fit you** → reach out; confirm she shows in Karen's
  Fit Read and can be **invited** (the "I'm wanted" moment in `/invites`).

### The cross-persona loop (the real proof)
Marcus builds a profile → it persists → Karen's Fit Read surfaces him → Karen spends a
token to reach out → Marcus sees "a company wants you." One shared DB; never run end to end.

### The Placed Veteran
- **Serve Forward**: share a one-tap link; confirm attribution tracks back.

### The Veteran Champion
- Open the QR/invite link from the Champions page in a fresh browser → land on `/c/<code>`
  → opt in → confirm the lead is captured and attributed to that office.

---

## 4. What's verified vs not

- **Verified now (keyless demo):** every web route renders; candidate + company flows
  walkable; ElevenLabs voice end-to-end; all three workspaces typecheck.
- **Not yet runtime-tested:** anything that writes to Postgres (story/assessment/video/
  record/apply/chapters persistence, the AI-narrated employer Fit Read), and the **entire
  mobile app on a device**. These typecheck and the demo paths work, but need the keys above
  and a real device to fully exercise.

### Deferred by design (won't block the core test)
Weekly digest send (needs an email/SMS provider), Stripe token top-ups, configurable
verticals (Epic 7). The Champion QR image is now built (server-side, no external service).
