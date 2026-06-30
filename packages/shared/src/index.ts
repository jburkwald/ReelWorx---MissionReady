// @reelworx/shared — ISOMORPHIC entry.
//
// Safe to import from BOTH apps (mobile + web). Contains types, theme tokens, brand
// strings, validation, the deterministic Fit Read core, and the HTTP API client.
// It must never import anything server-only (Prisma, vendor SDKs with secrets) —
// that lives behind @reelworx/shared/server.

export * from './brand';
export * from './config';
export * from './theme/tokens';
export * from './types/domain';
export * from './types/fit';
export * from './types/credibility';
export * from './types/paths';
export * from './fit/score';
export * from './profile/strength';
export * from './profile/living';
export * from './story/types';
export * from './story/phases';
export * from './story/record';
export * from './story/voice';
export * from './location';
export * from './jobs/demo';
export * from './paths/demo';
export * from './studio/themes';
export * from './assessment';
export * from './api/client';
export * from './media/types';
export * from './validation';
