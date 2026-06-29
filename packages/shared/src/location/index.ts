// Location reference + autocomplete — ISOMORPHIC.
//
// Powers two DISTINCT profile fields (never conflate them — see the schema's Root.kind):
//   • Hometown — a single place the candidate is FROM (the "Come Home" target, Feature 3.3).
//   • Open To — MANY places the candidate would relocate TO (discoverability).
//
// Both are typed as the same `LocationRef` shape so the UI autocompletes them identically,
// but they live in separate fields and are searched separately. This is a curated, offline
// dataset (no geocoder dependency in the MVP): the top US metros, all states, and a few
// honest "anywhere in <region>" options so someone can say "anywhere in the Southeast" and
// have it become real, filterable data instead of free text.

export type LocationKind = 'metro' | 'state' | 'region' | 'remote';

/** A structured location. This exact shape is what gets stored in Profile.openTo (as an
 *  array) and is what Hometown resolves to before it is flattened to its label. */
export interface LocationRef {
  /** Canonical display + stored value, e.g. "Milwaukee, WI" or "Anywhere in the Southeast". */
  label: string;
  kind: LocationKind;
}

interface LocationSeed extends LocationRef {
  /** Extra match terms (state names, nicknames). Never displayed or stored. */
  aliases?: string[];
}

// Top US metros by population / veteran density. Label is the stored canonical form.
const METROS: LocationSeed[] = [
  { label: 'New York, NY', kind: 'metro', aliases: ['nyc', 'new york city', 'manhattan', 'brooklyn'] },
  { label: 'Los Angeles, CA', kind: 'metro', aliases: ['la', 'socal'] },
  { label: 'Chicago, IL', kind: 'metro' },
  { label: 'Houston, TX', kind: 'metro' },
  { label: 'Phoenix, AZ', kind: 'metro' },
  { label: 'Philadelphia, PA', kind: 'metro', aliases: ['philly'] },
  { label: 'San Antonio, TX', kind: 'metro' },
  { label: 'San Diego, CA', kind: 'metro' },
  { label: 'Dallas, TX', kind: 'metro', aliases: ['dfw', 'fort worth'] },
  { label: 'Austin, TX', kind: 'metro' },
  { label: 'Jacksonville, FL', kind: 'metro' },
  { label: 'Fort Worth, TX', kind: 'metro' },
  { label: 'Columbus, OH', kind: 'metro' },
  { label: 'Charlotte, NC', kind: 'metro' },
  { label: 'Indianapolis, IN', kind: 'metro', aliases: ['indy'] },
  { label: 'Seattle, WA', kind: 'metro' },
  { label: 'Denver, CO', kind: 'metro' },
  { label: 'Washington, DC', kind: 'metro', aliases: ['dc', 'd.c.', 'washington dc'] },
  { label: 'Nashville, TN', kind: 'metro' },
  { label: 'Oklahoma City, OK', kind: 'metro', aliases: ['okc'] },
  { label: 'Boston, MA', kind: 'metro' },
  { label: 'Las Vegas, NV', kind: 'metro', aliases: ['vegas'] },
  { label: 'Portland, OR', kind: 'metro' },
  { label: 'Detroit, MI', kind: 'metro' },
  { label: 'Memphis, TN', kind: 'metro' },
  { label: 'Louisville, KY', kind: 'metro' },
  { label: 'Milwaukee, WI', kind: 'metro' },
  { label: 'Albuquerque, NM', kind: 'metro' },
  { label: 'Tucson, AZ', kind: 'metro' },
  { label: 'Fresno, CA', kind: 'metro' },
  { label: 'Sacramento, CA', kind: 'metro' },
  { label: 'Kansas City, MO', kind: 'metro', aliases: ['kc'] },
  { label: 'Atlanta, GA', kind: 'metro', aliases: ['atl'] },
  { label: 'Colorado Springs, CO', kind: 'metro' },
  { label: 'Raleigh, NC', kind: 'metro' },
  { label: 'Virginia Beach, VA', kind: 'metro', aliases: ['hampton roads', 'norfolk'] },
  { label: 'Miami, FL', kind: 'metro' },
  { label: 'Tampa, FL', kind: 'metro' },
  { label: 'Orlando, FL', kind: 'metro' },
  { label: 'Minneapolis, MN', kind: 'metro', aliases: ['twin cities', 'st paul'] },
  { label: 'Pittsburgh, PA', kind: 'metro' },
  { label: 'Cincinnati, OH', kind: 'metro' },
  { label: 'St. Louis, MO', kind: 'metro' },
  { label: 'Salt Lake City, UT', kind: 'metro', aliases: ['slc'] },
  { label: 'Fayetteville, NC', kind: 'metro', aliases: ['fort bragg', 'fort liberty'] },
  { label: 'Killeen, TX', kind: 'metro', aliases: ['fort hood', 'fort cavazos'] },
  { label: 'Pensacola, FL', kind: 'metro' },
];

// All 50 states + DC, so "anywhere in Texas" resolves cleanly.
const STATES: LocationSeed[] = (
  [
    ['Alabama', 'AL'], ['Alaska', 'AK'], ['Arizona', 'AZ'], ['Arkansas', 'AR'],
    ['California', 'CA'], ['Colorado', 'CO'], ['Connecticut', 'CT'], ['Delaware', 'DE'],
    ['Florida', 'FL'], ['Georgia', 'GA'], ['Hawaii', 'HI'], ['Idaho', 'ID'],
    ['Illinois', 'IL'], ['Indiana', 'IN'], ['Iowa', 'IA'], ['Kansas', 'KS'],
    ['Kentucky', 'KY'], ['Louisiana', 'LA'], ['Maine', 'ME'], ['Maryland', 'MD'],
    ['Massachusetts', 'MA'], ['Michigan', 'MI'], ['Minnesota', 'MN'], ['Mississippi', 'MS'],
    ['Missouri', 'MO'], ['Montana', 'MT'], ['Nebraska', 'NE'], ['Nevada', 'NV'],
    ['New Hampshire', 'NH'], ['New Jersey', 'NJ'], ['New Mexico', 'NM'], ['New York', 'NY'],
    ['North Carolina', 'NC'], ['North Dakota', 'ND'], ['Ohio', 'OH'], ['Oklahoma', 'OK'],
    ['Oregon', 'OR'], ['Pennsylvania', 'PA'], ['Rhode Island', 'RI'], ['South Carolina', 'SC'],
    ['South Dakota', 'SD'], ['Tennessee', 'TN'], ['Texas', 'TX'], ['Utah', 'UT'],
    ['Vermont', 'VT'], ['Virginia', 'VA'], ['Washington', 'WA'], ['West Virginia', 'WV'],
    ['Wisconsin', 'WI'], ['Wyoming', 'WY'], ['Washington, D.C.', 'DC'],
  ] as [string, string][]
).map(([name, abbr]) => ({ label: name, kind: 'state' as const, aliases: [abbr.toLowerCase()] }));

// Honest regional buckets so "anywhere in the Southeast" is structured, filterable data.
const REGIONS: LocationSeed[] = [
  { label: 'Anywhere in the Northeast', kind: 'region' },
  { label: 'Anywhere in the Southeast', kind: 'region', aliases: ['south'] },
  { label: 'Anywhere in the Midwest', kind: 'region' },
  { label: 'Anywhere in the Southwest', kind: 'region' },
  { label: 'Anywhere on the West Coast', kind: 'region', aliases: ['west'] },
  { label: 'Anywhere in the Mountain West', kind: 'region', aliases: ['rockies'] },
  { label: 'Anywhere in the Pacific Northwest', kind: 'region', aliases: ['pnw'] },
  { label: 'Remote, anywhere', kind: 'remote', aliases: ['remote', 'work from home', 'wfh'] },
];

const ALL: LocationSeed[] = [...METROS, ...STATES, ...REGIONS];

const normalize = (s: string) => s.trim().replace(/\s+/g, ' ');
const key = (s: string) => normalize(s).toLowerCase();

/** Public form (no aliases) keyed by canonical label, deduped. */
const CATALOG: LocationRef[] = Array.from(
  new Map(ALL.map((l) => [key(l.label), { label: normalize(l.label), kind: l.kind }])).values(),
);

/** Canonical label for a raw place string, if we recognize it; otherwise the trimmed input. */
export function canonicalLocationLabel(raw: string): string {
  const k = key(raw);
  const hit = ALL.find((l) => key(l.label) === k || l.aliases?.some((a) => key(a) === k));
  return hit ? normalize(hit.label) : normalize(raw);
}

/** Resolve a raw string to a structured LocationRef (kind 'metro' if unrecognized — a real
 *  place we just don't have in the curated set). */
export function toLocationRef(raw: string): LocationRef {
  const k = key(raw);
  const hit = ALL.find((l) => key(l.label) === k || l.aliases?.some((a) => key(a) === k));
  return hit ? { label: normalize(hit.label), kind: hit.kind } : { label: normalize(raw), kind: 'metro' };
}

/**
 * Autocomplete: suggestions for a partial query, ranked prefix-first then substring. Matches
 * label and aliases. Empty query returns the most useful defaults (big metros + regions).
 * This is the single source the Hometown picker and the Open To multi-select both call.
 */
export function suggestLocations(query: string | null | undefined, limit = 8): LocationRef[] {
  const q = key(query ?? '');
  if (!q) {
    return [...METROS.slice(0, 6), ...REGIONS.slice(0, 2)].map((l) => ({ label: normalize(l.label), kind: l.kind }));
  }
  const scored: { ref: LocationRef; score: number }[] = [];
  for (const l of ALL) {
    const hay = [l.label, ...(l.aliases ?? [])].map(key);
    let best = Infinity;
    for (const h of hay) {
      if (h === q) best = Math.min(best, 0);
      else if (h.startsWith(q)) best = Math.min(best, 1);
      else if (h.includes(q)) best = Math.min(best, 2);
    }
    if (best < Infinity) scored.push({ ref: { label: normalize(l.label), kind: l.kind }, score: best });
  }
  const seen = new Set<string>();
  return scored
    .sort((a, b) => a.score - b.score || a.ref.label.localeCompare(b.ref.label))
    .filter((s) => (seen.has(key(s.ref.label)) ? false : (seen.add(key(s.ref.label)), true)))
    .slice(0, limit)
    .map((s) => s.ref);
}

/** Clean an arbitrary Open To list into deduped canonical LocationRefs (drops blanks). */
export function normalizeOpenTo(input: Array<LocationRef | string> | null | undefined): LocationRef[] {
  if (!input?.length) return [];
  const out: LocationRef[] = [];
  const seen = new Set<string>();
  for (const item of input) {
    const ref = typeof item === 'string' ? toLocationRef(item) : { label: normalize(item.label), kind: item.kind };
    if (!ref.label) continue;
    const k = key(ref.label);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(ref);
  }
  return out;
}

export { CATALOG as LOCATION_CATALOG };
