# Behavioral Design Reference

This is a requirement, not a nice-to-have layer added after the fact. Every profile-building, listing, and matching surface should trace back to one of these principles. Build with intent, not default app patterns borrowed without reason.

## The principles, and where each one lives in the MVP

**Signaling theory (costly signals carry real information)**
Free, infinite applications carry no information — that is why volume-based hiring drowns everyone. Tokens make a reach-out cost something, so when it happens, it means something.
- *Lives in:* Intentful Reach, Two-Way Recruiting (Epic 3). The token balance should always be visible, never hidden, so the cost is felt at the moment of decision, not buried in settings.

**Self-Determination Theory — autonomy, competence, relatedness**
The three things that make an experience intrinsically motivating rather than something a person has to be pushed through.
- *Autonomy:* the candidate chooses when to spend a token, which paths to explore, when to add a living-profile chapter. Never auto-submit or auto-apply on their behalf.
- *Competence:* the profile-strength meter, the Full Spectrum assessment results, and path-discovery "why this fits" explanations all give a person a growing, legible sense of their own capability — framed as growth, never deficiency.
- *Relatedness:* the Placed Veteran's story, the Champion connection, the "company planted its flag" moment all build a felt sense of belonging to something, not just using a tool.

**Realistic job preview research**
Decades of organizational psychology research shows that a realistic preview of the actual work (not a polished, generic pitch) reduces early turnover because people self-select more accurately.
- *Lives in:* every Reel defaults to video-first, real-footage storytelling. Resist any pressure to let a company skip the video and post text-only — that is the resume problem we are trying to replace, just with a job description instead of a CV.

**Progress and completion bias (the Zeigarnik effect / goal-gradient effect)**
People are disproportionately motivated to finish something they have already started, and motivation increases as the visible finish line gets closer.
- *Lives in:* the Story Profile build flow. Show a visible, honest progress indicator throughout. The re-engagement reminder (Feature 1.2) when someone stops partway should reference how close they are to finishing, not just nag generically.

**Variable, earned celebration (not gamification for its own sake)**
Reward moments that are too frequent or unearned stop meaning anything (see the Design Language doc's note on restraint). Reserve celebratory UI for moments that are genuinely meaningful: a profile-strength jump, a new match, a hire.
- *Lives in:* the Wrapped-style full-screen moments described in `DESIGN_LANGUAGE.md`. These should correspond 1:1 with real Event types in the data model (`match_created`, milestone crossings, `hired`), never triggered just to keep someone engaged.

**Loss aversion, used carefully and ethically**
People feel the prospect of losing something more than the prospect of gaining an equivalent thing. This is powerful and easy to abuse — use it only in honest, non-manipulative ways.
- *Acceptable use:* a token expiring soon, gently surfaced, factual.
- *Not acceptable:* manufactured scarcity, fake "3 other people are viewing this role" pressure, or anything that creates anxiety not grounded in a real fact. This platform exists to replace manipulative hiring patterns, not import them.

## Applying this to the two sides differently

**Candidate side (Marcus, mobile):** the behavioral design goal is confidence and momentum. Someone who does not yet know who they become next should feel the app is patiently drawing out their story and showing them real, fitting possibilities — never overwhelmed, never judged, always shown a next small step.

**Company side (Karen, web):** the behavioral design goal is trust and efficient signal. A hiring leader should feel that every candidate she sees is a real signal, that the dashboard tells her plainly whether this is working, and that taking action (reaching out, reviewing a fit read) is fast and low-friction. Her behavioral lever is not delight, it is confidence that the system filters noise honestly.

## A standing rule for Claude Code

Before shipping any new screen or interaction, ask: which principle above does this serve, and is there a simpler, more honest version of the same nudge? If a pattern is being added purely because "apps usually do this" (infinite scroll without purpose, streaks, badges with no real meaning, fake urgency), it should be flagged rather than built by default.
