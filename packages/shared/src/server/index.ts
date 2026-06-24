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
export { runStoryTurn } from './agent';
export {
  saveAssessment,
  type SaveAssessmentInput,
  type SaveAssessmentResult,
} from './assessment';
export {
  createIntroVideoUpload,
  saveIntroVideo,
  type SaveIntroVideoResult,
} from './intro-video';
export {
  deriveIdealProfile,
  createRole,
  listRolesForOrg,
  getRole,
  type CreateRoleInput,
} from './roles';
export {
  buildFitRead,
  narrateFitRead,
  type FitReadContext,
} from './narrate';
export {
  suggestMatchesForRole,
  getMatchesForRole,
  type CandidateSummary,
  type SuggestedMatch,
} from './matches';
export {
  decodeCredibility,
  ensureDecodedCredibility,
  type DecodeInput,
} from './decode';
export {
  generatePathSuggestions,
  listPathSuggestions,
  decidePathSuggestion,
  type PathView,
  type PathDecision,
} from './paths';
export {
  MONTHLY_INVITE_ALLOTMENT,
  ensureMonthlyInviteTokens,
  getInviteBalance,
  getReadyInviteBalance,
  spendInviteToken,
} from './tokens';
export {
  reachOutToCandidate,
  listInvitesForCandidate,
  type ReachOutResult,
  type ReachOutStatus,
  type InviteView,
} from './reach';
export {
  setRoots,
  listRoots,
  type RootInput,
  type RootView,
} from './roots';
export {
  searchCandidates,
  type PeopleSearchResult,
  type SearchCandidatesInput,
} from './search';
export {
  getEmployerDashboard,
  getCandidateDashboard,
  type EmployerDashboard,
  type CandidateDashboard,
  type RecentReachOut,
  type InterestedCompany,
} from './dashboard';
