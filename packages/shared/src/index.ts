// @reelworx/shared — ISOMORPHIC entry.
//
// Safe to import from BOTH apps (mobile + web). Contains types, theme tokens, brand
// strings, validation, the deterministic Fit Read core, and the HTTP API client.
// It must never import anything server-only (Prisma, vendor SDKs with secrets) —
// that lives behind @reelworx/shared/server.

export * from './brand';
export * from './theme/tokens';
export * from './types/domain';
export * from './types/fit';
export * from './fit/score';
export * from './api/client';
export * from './media/types';
export * from './validation';
