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
export { runStoryTurn, type RunStoryTurnOptions } from './agent';
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
  listPublishedJobs,
  getPublishedJob,
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
export { getOrCreatePathDetail } from './path-detail';
export {
  createStudioReel,
  listStudioReels,
  type CreateStudioReelInput,
  type StudioReelView,
} from './studio';
export {
  MONTHLY_INVITE_ALLOTMENT,
  ensureMonthlyInviteTokens,
  getInviteBalance,
  getReadyInviteBalance,
  spendInviteToken,
  MONTHLY_APPLICATION_ALLOTMENT,
  ensureMonthlyApplicationTokens,
  getApplicationBalance,
  getReadyApplicationBalance,
  spendApplicationToken,
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
  countNewCandidates,
  type PeopleSearchResult,
  type SearchCandidatesInput,
  type PlaceScope,
} from './search';
export {
  getPlaces,
  setPlaces,
  type PlacesView,
  type SetPlacesInput,
} from './places';
export {
  createAlert,
  deleteAlert,
  listAlerts,
  markAlertViewed,
  type AlertView,
} from './alerts';
export {
  getEmployerDashboard,
  getCandidateDashboard,
  type EmployerDashboard,
  type CandidateDashboard,
  type RecentReachOut,
  type InterestedCompany,
} from './dashboard';
export {
  strengthInputFromProfile,
  computeProfileStrengthForProfile,
  profileStrengthScoreForProfile,
  type ProfileStrengthFields,
} from './strength';
export { parseResume, type ParseResumeResult } from './resume';
export { saveVeteranRecord, type SaveRecordResult } from './record';
export { listLivingChapters, addLivingChapter } from './living';
export {
  getCandidateFitReads,
  getCandidateReachBalance,
  applyToRole,
  type CandidateFitRead,
  type ApplyResult,
  type ApplyStatus,
} from './candidate-matches';
export {
  voiceProviderConfigured,
  synthesizeSpeech,
  transcribeSpeech,
  type SynthesizeOptions,
  type SynthesizedSpeech,
} from './voice-provider';
export { getPublicProfile, type PublicProfile } from './public-profile';
export {
  ensureAdvocateForUser,
  createShareLink,
  recordShareClick,
  getAdvocateImpact,
  type CreateShareLinkInput,
  type AdvocateImpact,
} from './advocacy';
export {
  createChampion,
  listChampions,
  getChampionLanding,
  captureFromChampion,
  type ChampionView,
} from './champions';
export {
  captureOwnedLead,
  buildDigest,
  type DigestItem,
} from './capture';
export {
  isDbConfigured,
  demoCompanyUser,
  demoRoles,
  demoRole,
  demoMatches,
  demoEmployerDashboard,
  demoCandidateDashboard,
  demoCandidateFitReads,
  demoPeople,
  demoChampions,
  demoAlerts,
  demoStudioReels,
  DEMO_ORG_ID,
  DEMO_INVITE_BALANCE,
} from './demo';
