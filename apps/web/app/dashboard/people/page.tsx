import Link from 'next/link';
import { prisma, searchCandidates, type PeopleSearchResult } from '@reelworx/shared/server';

export const dynamic = 'force-dynamic';

// "Come Home" people search (Feature 3.3). A server component driven by the GET query —
// keyword + place — so a search is shareable, back-button-friendly, and needs no client JS.
export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; place?: string }>;
}) {
  const { q, place } = await searchParams;
  const hasQuery = Boolean(q?.trim() || place?.trim());

  let results: PeopleSearchResult[] = [];
  let dbDown = false;
  if (hasQuery) {
    try {
      results = await searchCandidates(prisma, { query: q, place, limit: 25 });
    } catch {
      dbDown = true;
    }
  }

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--gray-050)' }}>
      <header style={{ background: 'var(--white)', borderBottom: '1px solid var(--gray-100)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: 64 }}>
          <Link href="/dashboard" className="display" style={{ fontSize: 22 }}>
            ReelWorx · Find people
          </Link>
        </div>
        <div className="spectrum-bar" style={{ borderRadius: 0 }} />
      </header>

      <section className="container" style={{ paddingTop: 40, paddingBottom: 64, display: 'grid', gap: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Find people</h1>
          <p className="muted" style={{ marginTop: 6, maxWidth: 560 }}>
            Bring talent home. Search by what they do, and filter by the places they have
            roots — one search to reach the people tied to your region.
          </p>
        </div>

        <form method="GET" className="card" style={{ maxWidth: 760, display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <label style={{ flex: '1 1 240px', fontSize: 14, fontWeight: 600 }}>
              Keyword
              <input
                name="q"
                defaultValue={q ?? ''}
                placeholder="e.g. operations, logistics, sales"
                style={inputStyle}
              />
            </label>
            <label style={{ flex: '1 1 200px', fontSize: 14, fontWeight: 600 }}>
              Roots / hometown
              <input
                name="place"
                defaultValue={place ?? ''}
                placeholder="e.g. Columbus, OH"
                style={inputStyle}
              />
            </label>
          </div>
          <div>
            <button type="submit" className="btn btn-spectrum">Search</button>
          </div>
        </form>

        {dbDown ? (
          <div className="card" style={{ maxWidth: 620, borderColor: 'var(--spectrum-orange)' }}>
            <p className="muted" style={{ margin: 0 }}>
              Add <code>DATABASE_URL</code> and run <code>npm run db:push</code> to search people.
            </p>
          </div>
        ) : !hasQuery ? (
          <p className="muted" style={{ margin: 0 }}>
            Enter a keyword or a place to begin.
          </p>
        ) : results.length === 0 ? (
          <div className="card" style={{ maxWidth: 620 }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>No one yet</h2>
            <p className="muted" style={{ margin: 0 }}>
              No discoverable candidates match that search. Try a broader keyword or a nearby place.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              {results.length} {results.length === 1 ? 'person' : 'people'}
            </p>
            {results.map((r) => (
              <PersonCard key={r.candidateId} person={r} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

const inputStyle = {
  width: '100%',
  height: 46,
  borderRadius: 12,
  border: '1px solid var(--gray-100)',
  background: 'var(--white)',
  padding: '0 14px',
  fontSize: 15,
  marginTop: 6,
} as const;

function PersonCard({ person }: { person: PeopleSearchResult }) {
  return (
    <div className="card" style={{ maxWidth: 760 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
            {person.headline ?? person.displayName}
          </h3>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>
            {person.currentLocation ?? 'Location not shared'}
          </p>
        </div>
        <span className="muted" style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
          {person.completenessScore}% profile
        </span>
      </div>

      {person.roots.length ? (
        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {person.roots.map((root) => (
            <span
              key={root.place}
              style={{
                fontSize: 13,
                padding: '4px 10px',
                borderRadius: 999,
                background: root.isPrimary ? 'var(--gray-900)' : 'var(--gray-050)',
                color: root.isPrimary ? 'var(--white)' : undefined,
                border: '1px solid var(--gray-100)',
              }}
            >
              {root.isPrimary ? '★ ' : ''}
              {root.place}
            </span>
          ))}
        </div>
      ) : null}

      {person.decodedSummary ? (
        <p style={{ margin: '12px 0 0', fontSize: 14, lineHeight: 1.6 }}>{person.decodedSummary}</p>
      ) : null}
    </div>
  );
}
