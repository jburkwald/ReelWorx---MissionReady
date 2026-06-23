// Bridges the shared design tokens (packages/shared/src/theme/tokens.ts) into
// React-Native-friendly shapes. Apple-calm neutrals are the default; the spectrum
// is reserved for brand + milestone moments (Wrapped energy), per DESIGN_LANGUAGE.md.

import { neutral, radius, spectrum } from '@reelworx/shared';

export const colors = {
  ...spectrum,
  ...neutral,
  accent: spectrum.blue,
  bg: neutral.white,
  text: neutral.gray900,
  textMuted: neutral.gray400,
  border: neutral.gray100,
  fieldBg: neutral.gray050,
};

// Mutable tuple so it satisfies expo-linear-gradient's `colors` prop type.
export const spectrumColors: [string, string, ...string[]] = [
  spectrum.red,
  spectrum.orange,
  spectrum.yellow,
  spectrum.green,
  spectrum.blue,
  spectrum.indigo,
  spectrum.violet,
];

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export { radius };
