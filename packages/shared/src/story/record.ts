// The Veteran Door — structured service record (Feature 1.1) — isomorphic.
//
// Phase 1 of onboarding ("Your record") captures the military picture by TAP AND SELECT,
// never by free voice or free text (that discipline is in the backlog: structured data is
// chosen, the story is told). These option sets drive the chips on web and mobile, and the
// helpers turn a record into the same signals the rest of the profile reads, so completing
// the record advances the foundation exactly like the conversation does.
//
// Kept friendly: rank is a grade BAND, not 24 individual pay grades, and years are ranges,
// so the whole record is a handful of taps. No dashes in any user-facing label.

export type ServiceBranchId =
  | 'army'
  | 'marines'
  | 'navy'
  | 'air_force'
  | 'space_force'
  | 'coast_guard'
  | 'national_guard';

export type RankBandId =
  | 'junior_enlisted'
  | 'nco'
  | 'senior_nco'
  | 'warrant'
  | 'junior_officer'
  | 'senior_officer';

export type YearsBandId = 'lt4' | '4to8' | '8to12' | '12to20' | 'gt20';
export type SeparationStatusId = 'skillbridge' | 'transitioning' | 'recent' | 'veteran';
export type ClearanceLevelId = 'none' | 'secret' | 'top_secret' | 'ts_sci';

export interface Labeled<T extends string> {
  id: T;
  label: string;
  hint?: string;
}

export const SERVICE_BRANCHES: Labeled<ServiceBranchId>[] = [
  { id: 'army', label: 'Army' },
  { id: 'marines', label: 'Marine Corps' },
  { id: 'navy', label: 'Navy' },
  { id: 'air_force', label: 'Air Force' },
  { id: 'space_force', label: 'Space Force' },
  { id: 'coast_guard', label: 'Coast Guard' },
  { id: 'national_guard', label: 'National Guard' },
];

export const RANK_BANDS: Labeled<RankBandId>[] = [
  { id: 'junior_enlisted', label: 'Junior enlisted', hint: 'E-1 to E-4' },
  { id: 'nco', label: 'NCO', hint: 'E-5 to E-6' },
  { id: 'senior_nco', label: 'Senior NCO', hint: 'E-7 to E-9' },
  { id: 'warrant', label: 'Warrant Officer', hint: 'W-1 to W-5' },
  { id: 'junior_officer', label: 'Officer', hint: 'O-1 to O-3' },
  { id: 'senior_officer', label: 'Senior Officer', hint: 'O-4 and up' },
];

export const YEARS_BANDS: Labeled<YearsBandId>[] = [
  { id: 'lt4', label: 'Under 4 years' },
  { id: '4to8', label: '4 to 8 years' },
  { id: '8to12', label: '8 to 12 years' },
  { id: '12to20', label: '12 to 20 years' },
  { id: 'gt20', label: '20+ years' },
];

export const SEPARATION_STATUSES: Labeled<SeparationStatusId>[] = [
  { id: 'skillbridge', label: 'In SkillBridge now' },
  { id: 'transitioning', label: 'Transitioning out soon' },
  { id: 'recent', label: 'Recently separated' },
  { id: 'veteran', label: 'Veteran' },
];

export const CLEARANCE_LEVELS: Labeled<ClearanceLevelId>[] = [
  { id: 'none', label: 'None or prefer not to say' },
  { id: 'secret', label: 'Secret' },
  { id: 'top_secret', label: 'Top Secret' },
  { id: 'ts_sci', label: 'TS/SCI' },
];

export interface VeteranRecord {
  branch?: ServiceBranchId;
  rankBand?: RankBandId;
  yearsBand?: YearsBandId;
  separation?: SeparationStatusId;
  clearance?: ClearanceLevelId;
  /** Primary hometown (the first root). */
  hometown?: string;
  /** Additional places they have ties to (Feature 3.3 roots). */
  roots?: string[];
}

const label = <T extends string>(set: Labeled<T>[], id?: T): string | undefined =>
  id ? set.find((o) => o.id === id)?.label : undefined;

export const branchLabel = (id?: ServiceBranchId) => label(SERVICE_BRANCHES, id);
export const rankBandLabel = (id?: RankBandId) => label(RANK_BANDS, id);
export const yearsBandLabel = (id?: YearsBandId) => label(YEARS_BANDS, id);
export const separationLabel = (id?: SeparationStatusId) => label(SEPARATION_STATUSES, id);
export const clearanceLabel = (id?: ClearanceLevelId) => label(CLEARANCE_LEVELS, id);

/** A human headline from the record, e.g. "Army Senior NCO, 12 to 20 years". */
export function recordHeadline(r: VeteranRecord): string {
  const parts = [branchLabel(r.branch), rankBandLabel(r.rankBand)].filter(Boolean).join(' ');
  const years = yearsBandLabel(r.yearsBand);
  return [parts, years].filter(Boolean).join(', ');
}

/** Enough of the record to count Phase 1 done: who they are and where they are in transition. */
export function recordComplete(r: VeteranRecord): boolean {
  return Boolean(r.branch && r.rankBand && r.separation);
}

/** All roots, primary first, deduped and trimmed. */
export function recordRoots(r: VeteranRecord): string[] {
  const all = [r.hometown, ...(r.roots ?? [])].map((s) => s?.trim()).filter(Boolean) as string[];
  return Array.from(new Set(all));
}
