// Design tokens shared across the mobile (Expo/React Native) and web (Next.js) apps.
// See /docs/DESIGN_LANGUAGE.md for the full rationale. This file is a strong
// starting draft — refine values, do not change the underlying structure
// without updating the design doc to match.

// Brand palette: black, white, red. Energy / "moment" treatments use the flag —
// red, white, blue — NEVER a rainbow.
export const brand = {
  red: '#E4002B',
  blue: '#1D4ED8',
  black: '#0A0A0A',
  white: '#FFFFFF',
} as const;

// Legacy name kept so existing consumers keep compiling; every value is now red,
// white, or blue (the rainbow spectrum was retired). Prefer `brand` in new code.
export const spectrum = {
  red: brand.red,
  orange: brand.red,
  yellow: brand.white,
  green: brand.blue,
  blue: brand.blue,
  indigo: brand.blue,
  violet: brand.red,
} as const;

// Energy gradient stops — red → blue (the flag). Used for milestone / brand moments.
export const flagColors: [string, string] = [brand.red, brand.blue];

export const neutral = {
  black: '#0A0A0A',
  white: '#FFFFFF',
  gray050: '#F7F7F8',
  gray100: '#EDEDEF',
  gray400: '#9A9AA0',
  gray700: '#3C3C43',
  gray900: '#1C1C1E',
} as const;

export const fontFamily = {
  display: 'BebasNeue-Regular',
  body: 'DMSans-Regular',
  bodyMedium: 'DMSans-Medium',
  bodyBold: 'DMSans-Bold',
  system: 'system-ui, -apple-system, sans-serif',
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 24,
  full: 999,
} as const;

export const motion = {
  springConfig: { damping: 18, stiffness: 220, mass: 1 },
  celebrationDurationMs: 600,
} as const;

export const theme = { brand, spectrum, neutral, fontFamily, radius, motion } as const;

export type Theme = typeof theme;
