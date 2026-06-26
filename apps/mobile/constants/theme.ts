// Bridges the shared design tokens (packages/shared/src/theme/tokens.ts) into
// React-Native-friendly shapes. Apple-calm neutrals are the default; the spectrum
// is reserved for brand + milestone moments (Wrapped energy), per DESIGN_LANGUAGE.md.

import { brand, neutral, radius, spectrum } from '@reelworx/shared';

export const colors = {
  ...spectrum,
  ...neutral,
  red: brand.red,
  blue: brand.blue,
  accent: brand.red, // red is the brand accent now (no more rainbow)
  bg: neutral.white,
  text: neutral.gray900,
  textMuted: neutral.gray400,
  border: neutral.gray100,
  fieldBg: neutral.gray050,
};

// Red → blue (the flag). Never a rainbow. Mutable tuple to satisfy expo-linear-gradient.
export const spectrumColors: [string, string, ...string[]] = [brand.red, brand.blue];

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export { radius };
