# Design Language Reference

Two references, layered, not chosen one-over-the-other. Read this before writing any UI code, and read the `frontend-design` skill if available in the build environment.

## The blend, in one sentence

**Apple governs structure. Spotify Wrapped governs moments.** The app should feel calm, native, and effortless to navigate (Apple), and then light up with bold color and oversized confidence at the handful of moments that deserve celebration (Wrapped) — a match, a profile-strength milestone, a hire.

## What "Apple" means here, concretely

- System font stack (SF Pro on iOS, Roboto/system default on Android, `-apple-system` / `system-ui` on web) — never load a licensed Apple font.
- Generous whitespace, clear type hierarchy (large confident headlines, restrained body text), no visual clutter competing for attention.
- Native interaction patterns: iOS-style sheet presentations, haptic feedback on key mobile actions (token spend, match reveal, video finished uploading), platform-appropriate navigation (tab bar on mobile, persistent sidebar on web).
- Motion is purposeful and physics-based (spring animations, not linear), never decorative for its own sake.
- Color is calm and confident in the structural chrome — neutral backgrounds, careful use of a primary accent — reserving boldness for the moments described below.

## What "Spotify Wrapped" means here, concretely

- The ReelWorx palette is **black, white, and red** for the brand, and **red, white, and blue** (the flag) for celebratory and identity moments on black — **never a rainbow**. Red is the primary accent; the energy "gradient" is red → blue. Used for moments, not for every screen.
- Oversized, confident type treatment for a single key number or statement at a milestone moment ("Your profile strength: 92%", "You have a new match", "Karen wants to talk to you").
- Bold gradient color blocks as section dividers or card backgrounds for story content (Reels, profile cards) — this is where the brand's personality lives day-to-day, distinct from the celebratory full-screen moments.
- Bebas Neue for display/headline moments, DM Sans for everything readable — this is the locked ReelWorx type pairing, carried over from existing brand work.

## Where each governs, by screen

| Screen / moment | Apple (structure) | Wrapped (energy) |
|---|---|---|
| Story Profile build flow | Calm, step-by-step, native form patterns | Profile strength meter uses spectrum color fill |
| Explore feed | Clean vertical scroll, native video controls | Each Reel card uses spectrum gradient framing |
| Match reveal | — | Full Wrapped treatment: full-screen, bold color, big type, a moment worth a haptic buzz |
| Employer dashboard (web) | Apple-grade clarity: charts, tables, calm data density | Spectrum color used sparingly for key metrics only |
| Token spend | Native confirmation sheet, simple and clear | Subtle spectrum accent confirms the action landed |
| Hire / "you got it" moment | — | The biggest Wrapped moment in the product — full color, full confidence |

## Starting design tokens

Build these in `packages/shared/src/theme/tokens.ts` and consume from both apps. Treat as a first draft for the team to refine, not final.

```ts
// Brand: black, white, red. "Moment" energy uses the flag — red, white, blue.
// NEVER a rainbow. (`spectrum` is kept as a legacy alias mapped to these values.)
export const brand = {
  red: '#E4002B',
  blue: '#1D4ED8',
  black: '#0A0A0A',
  white: '#FFFFFF',
};
// Energy gradient stops — red → blue (the flag).
export const flagColors = ['#E4002B', '#1D4ED8'];

export const neutral = {
  black: '#0A0A0A',      // primary dark background, Wrapped-style surfaces
  white: '#FFFFFF',
  gray050: '#F7F7F8',    // Apple-style light backgrounds
  gray100: '#EDEDEF',
  gray400: '#9A9AA0',
  gray700: '#3C3C43',
  gray900: '#1C1C1E',
};

export const fontFamily = {
  display: 'BebasNeue-Regular',   // headline / Wrapped moments only
  body: 'DMSans-Regular',         // everything readable
  bodyMedium: 'DMSans-Medium',
  bodyBold: 'DMSans-Bold',
  system: 'system-ui, -apple-system, sans-serif', // web fallback, native default on mobile
};

export const radius = {
  sm: 8,
  md: 14,    // Apple's typical card corner radius
  lg: 24,
  full: 999,
};

export const motion = {
  springConfig: { damping: 18, stiffness: 220, mass: 1 }, // Apple-style spring, not linear easing
  celebrationDuration: 600, // Wrapped-style moment, fast and bold, not lingering
};
```

## A note on restraint

The biggest risk with this blend is overusing the Wrapped energy until it stops meaning anything. If every screen is loud, nothing feels like a milestone. Apple's discipline — say less, mean more — is what makes the Wrapped moments land. When in doubt, build the calm version first and add color only where a real moment is being marked.
