// SERVER-ONLY entry: @reelworx/shared/server
//
// Everything here can touch the database, vendor secrets, or server runtime APIs.
// The mobile app must NEVER import from this entry — it reaches the backend over
// HTTP via the api client in the isomorphic entry instead.

export { prisma } from './db';
export * from './db'; // generated Prisma types + enums + Prisma namespace
export { media } from './media';
export { getAnthropic, MODELS, type ModelRole } from './ai';
export { logEvent, EVENT_TYPES, type EventType, type LogEventInput } from './events';
export {
  syncUser,
  createOrganizationForAdmin,
  type SyncUserInput,
  type SyncedUser,
  type CreateOrganizationInput,
} from './users';
