# Data Model Reference

This is the proposed shape of the six core primitives plus the ERAP advocacy layer. Treat this as a strong starting draft, not gospel — Claude Code should propose the actual Prisma schema, and should flag if real implementation needs surface a better shape. The discipline that must survive any revision: **stay vertical-agnostic.** A "job" is a Reel with `type: job`. Do not create veteran-specific or job-specific tables where a generic, typed object would do — that is what lets Epic 7 (other missions) become a config change later instead of a rebuild.

## The six primitives

**User** (base identity)
`id`, `role` (candidate | company_admin | admin), `auth_id`, `email`, `hometown`, `current_location`, `roots` (array — see Profile), `created_at`

**Profile** (candidate-side)
`user_id`, `video_intro_url`, `headline`, `mos_code` (nullable), `mos_translation` (generated), `full_spectrum_scores` (jsonb — see Assessment below), `completeness_score`, `open_to_relocate` (bool), `roots` (array of `{place, is_primary, reason}` — supports "Come Home" search), `why_each_move` (array of short narrative entries tied to work history), `living_profile_chapters` (array, append-only, timestamped)

**Organization** (company-side)
`id`, `name`, `page_video_url`, `industry`, `locations` (array), `verified` (bool), `description`, `planted_flag_statement` (the public veteran-hiring commitment — this is a trust signal, treat as first-class, not a free-text afterthought)

**Reel** (the story unit — vertical-agnostic, this is the core content object)
`id`, `owner_id`, `type` (job | candidate | culture | campus | franchise), `theme_id`, `video_url`, `title`, `duration`, `role_id` (nullable), `created_at`

**Cast** (the audio depth unit)
`id`, `reel_id` (nullable), `owner_id`, `audio_url`, `transcript`, `type`, `runtime`, `audience` (general | personalized), `match_id` (nullable), `candidate_id` (nullable)

**Token** (the intent currency — this is also the revenue meter, instrument it cleanly)
`id`, `user_id`, `type` (application | invite), `status` (active | spent | expired), `spent_on` (target id, nullable), `created_at`, `expires_at`

**Match** (the connection object — this is where the Full Spectrum scoring lands)
`id`, `candidate_id`, `org_id`, `role_id`, `fit_score`, `fit_breakdown` (jsonb — dimension-by-dimension scores plus the plain-language "why" and any honest gaps), `status` (suggested | applied | invited | connected | passed), `created_at`

**Event** (everything that feeds dashboards, notifications, and the data flywheel — log generously from day one)
`id`, `actor_id`, `event_type` (view | watch_complete | token_spent | profile_view | match_created | reach_out_sent | path_suggested | path_rejected | ...), `target_id`, `metadata` (jsonb), `timestamp`

## Supporting objects

**Role** (a job posting — but named generically on purpose)
`id`, `org_id`, `title`, `location`, `description`, `mos_fit_tags`, `reel_id`, `ideal_profile` (jsonb — the role's target Full Spectrum dimensions, e.g. a sales role weighting high extraversion + grit + interpersonal EQ; this is what a Match scores a candidate against)

**Notification**
`id`, `user_id`, `type`, `channel` (push | sms | email), `payload`, `read`, `created_at`

**Advocate** (the ERAP / sharing layer)
`id`, `user_id` (nullable — an advocate may be external), `email`, `type` (employee | veteran_advocate | influencer | champion), `org_id` (nullable), `status` (active | pending_eligibility | approved | rejected)

**ShareLink**
`id`, `advocate_id`, `reel_id`, `org_id`, `short_url`, `tracking_params`, `created_at`

**AttributionEvent**
`id`, `share_link_id`, `event_type` (click | profile_created | applied | hired), `subject_email`, `timestamp`

## The Full Spectrum Assessment (Feature 1.5 / 1.6 in the backlog)

`full_spectrum_scores` on Profile, and `ideal_profile` on Role, should share the exact same five-dimension shape so a person and a role can be scored against each other directly:

```
{
  skills_experience: { ...translated skills, MOS mapping, civilian equivalents },
  personality: { extraversion, conscientiousness, openness, agreeableness, emotional_stability },
  resilience_drive: { grit_score, perseverance_indicators },
  emotional_intelligence: { self_awareness, empathy, interpersonal_skill },
  motivation_values: { core_values, what_drives_them, roots }
}
```

This is a working draft of the shape — the actual scoring methodology (how the agent derives these from a conversation, resume, or short assessment) is a product/content design problem to solve with Claude (the model) doing the inference, not something to hard-code as a quiz with fixed point values. Build the data shape to hold the output; build the assessment experience to be conversational and adaptive per the backlog (Feature 1.2).

**IP note:** the five dimensions are built from public, well-established psychological constructs (Big Five personality, grit/resilience research, emotional intelligence theory, values theory). Do not name this model after, or copy specific item wording from, any proprietary instrument (e.g., NEO-PI-R, Duckworth Grit Scale, EQ-i, or the "STACK" framework). "Full Spectrum" is a working name pending trademark clearance — see open decisions.

## Why this shape protects the long-term vision

- `Reel.type` and `Cast.type` being enums rather than separate tables is what lets Epic 7 (colleges, franchises, other missions) become new `type` values instead of new schemas.
- `Role.ideal_profile` and `Profile.full_spectrum_scores` sharing a shape is what makes the Fit Read (Epic 2) a direct comparison instead of a translation layer that has to be maintained twice.
- `Event` logging everything from day one is what makes Release 2 dashboards and Horizon-level predictive insight possible without a re-instrumentation project later.
- `Advocate`/`ShareLink`/`AttributionEvent` existing as their own objects (not bolted onto Reel) is what lets the advocacy layer extend cleanly to influencers and champions later without touching the content model.
