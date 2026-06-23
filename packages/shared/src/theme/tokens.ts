// Design tokens shared across the mobile (Expo/React Native) and web (Next.js) apps.
// See /docs/DESIGN_LANGUAGE.md for the full rationale. This file is a strong
// starting draft — refine values, do not change the underlying structure
// without updating the design doc to match.

export const spectrum = {
  red: '#FF3B30',
  orange: '#FF9500',
  yellow: '#FFD60A',
  green: '#34C759',
  blue: '#0A84FF',
  indigo: '#5E5CE6',
  violet: '#AF52DE',
} as const;

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

export const theme = { spectrum, neutral, fontFamily, radius, motion } as const;

export type Theme = typeof theme;
