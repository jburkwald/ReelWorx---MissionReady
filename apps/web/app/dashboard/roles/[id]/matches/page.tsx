import Link from 'next/link';
import {
  getMatchesForRole,
  getRole,
  prisma,
  type SuggestedMatch,
} from '@reelworx/shared/server';
import {
  FIT_DIMENSION_LABELS,
  FIT_DIMENSIONS,
  type FitDimension,
  type IdealProfile,
} from '@reelworx/shared';
import { runFitReadAction } from './actions';

export const dynamic = 'force-dynamic';

// A dimension is shown only if the ROLE asked for it — mirrors fit/score.ts so we never
// show a misleading 0 bar for something the role never constrained. A constrained
// dimension that scores low IS shown (that's an honest gap, not noise).
function isConstrained(ideal: IdealProfile, dim: FitDimension): boolean {
  switch (dim) {
    case 'personality':
      return Object.keys(ideal.personality ?? {}).length > 0;
    case 'resilienceDrive':
      return typeof ideal.resilienceDrive?.gritScore === 'number';
    case 'emotionalIntelligence':
      return Object.values(ideal.emotionalIntelligence ?? {}).some((v) => typeof v === 'number');
    case 'skillsExperience':
      return (ideal.skillsExperience?.translatedSkills?.length ?? 0) > 0;
    case 'motivationValues':
      return (ideal.motivationValues?.coreValues?.length ?? 0) > 0;
  }
}

export default async function RoleMatchesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let role: Awaited<ReturnType<typeof getRole>> = null;
  let matches: SuggestedMatch[] = [];
  let dbDown = false;
  try {
    role = await getRole(prisma, id);
    if (role) matches = await getMatchesForRole(prisma, id);
  } catch {
    dbDown = true;
  }

  if (!dbDown && !role) {
    return (
      <main className="container" style={{ paddingTop: 64 }}>
        <p>
          Role not found.{' '}
          <Link href="/dashboard/roles" style={{ textDecoration: 'underline' }}>
            Back to roles
          </Link>
        </p>
      </main>
    );
  }

  const ideal = (role?.idealProfile ?? {}) as IdealProfile;
  const constrained = FIT_DIMENSIONS.filter((d) => isConstrained(ideal, d));
  const runForRole = runFitReadAction.bind(null, id);

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--gray-050)' }}>
      <header style={{ background: 'var(--white)', borderBottom: '1px solid var(--gray-100)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: 64 }}>
          <Link href={`/dashboard/roles/${id}`} className="display" style={{ fontSize: 22 }}>
            ‹ {role?.title ?? 'Role'}
          </Link>
        </div>
        <div className="spectrum-bar" style={{ borderRadius: 0 }} />
      </header>

      <section
        className="container"
        style={{ paddingTop: 40, paddingBottom: 64, display: 'grid', gap: 24 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Suggested people</h1>
            <p className="muted" style={{ marginTop: 6, maxWidth: 560 }}>
              Fewer, better. Ranked by Full Spectrum fit and decoded in plain language —
              same five dimensions on both sides, honest about the gaps.
            </p>
          </div>
          <form action={runForRole}>
            <button type="submit" className={matches.length ? 'btn btn-ghost' : 'btn btn-spectrum'}>
              {matches.length ? 'Refresh the Fit Read' : 'Run the Fit Read'}
            </button>
          </form>
        </div>

        {dbDown ? (
          <div className="card" style={{ maxWidth: 620, borderColor: 'var(--spectrum-orange)' }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>Connect your database</h2>
            <p className="muted" style={{ marginTop: 0 }}>
              Add <code>DATABASE_URL</code> to <code>.env</code> and run{' '}
              <code>npm run db:push</code> to read candidates against this role.
            </p>
          </div>
        ) : matches.length === 0 ? (
          <div className="card" style={{ maxWidth: 620 }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>No suggestions yet</h2>
            <p className="muted" style={{ marginTop: 0 }}>
              Run the Fit Read to score the candidate pool against this role. We read the{' '}
              whole person, surface the strongest matches, and tell you why each one fits —
              and where they don&apos;t.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {matches.map((m) => (
              <MatchCard key={m.candidate.candidateId} match={m} constrained={constrained} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function MatchCard({
  match,
  constrained,
}: {
  match: SuggestedMatch;
  constrained: FitDimension[];
}) {
  const { candidate, breakdown, tier } = match;
  return (
    <div className="card" style={{ maxWidth: 760 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
            {candidate.headline ?? candidate.displayName}
          </h3>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>
            {[candidate.hometown && `Roots: ${candidate.hometown}`, candidate.currentLocation]
              .filter(Boolean)
              .join(' · ') || 'Location not shared'}
          </p>
        </div>
        {/* Earned celebration: the spectrum reveal fires only on an exceptional fit. */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div
            className={tier.celebratory ? 'display spectrum-text' : undefined}
            style={{
              fontSize: tier.celebratory ? 44 : 34,
              fontWeight: 700,
              lineHeight: 1,
              color: tier.celebratory ? undefined : 'var(--gray-900)',
            }}
          >
            {breakdown.overall}
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.04em',
              marginTop: 4,
              color: tier.celebratory ? 'var(--spectrum-violet)' : 'var(--gray-400)',
              textTransform: 'uppercase',
            }}
          >
            {tier.label}
          </div>
        </div>
      </div>

      <p style={{ margin: '16px 0 0', lineHeight: 1.6 }}>{breakdown.plainLanguageWhy}</p>

      {constrained.length > 0 ? (
        <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
          {constrained.map((dim) => {
            const score = breakdown.dimensionScores[dim] ?? 0;
            return (
              <div key={dim}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{FIT_DIMENSION_LABELS[dim]}</span>
                  <span className="muted" style={{ fontSize: 12 }}>{score}</span>
                </div>
                <div style={{ marginTop: 5, height: 7, borderRadius: 999, background: 'var(--gray-100)', overflow: 'hidden' }}>
                  <div style={{ width: `${score}%`, height: '100%', background: 'var(--spectrum)' }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <div style={{ marginTop: 18, borderTop: '1px solid var(--gray-100)', paddingTop: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--gray-700)', textTransform: 'uppercase' }}>
          Honest gaps
        </span>
        {breakdown.honestGaps.length === 0 ? (
          <p className="muted" style={{ margin: '6px 0 0', fontSize: 14 }}>
            No material gaps for this role.
          </p>
        ) : (
          <ul style={{ margin: '8px 0 0', paddingLeft: 18, display: 'grid', gap: 4 }}>
            {breakdown.honestGaps.map((g, i) => (
              <li key={i} style={{ fontSize: 14, lineHeight: 1.5 }}>{g}</li>
            ))}
          </ul>
        )}
      </div>

      {candidate.mosTranslation ? (
        <p className="muted" style={{ margin: '14px 0 0', fontSize: 13, lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--gray-700)' }}>Decoded:</strong> {candidate.mosTranslation}
        </p>
      ) : null}
    </div>
  );
}
