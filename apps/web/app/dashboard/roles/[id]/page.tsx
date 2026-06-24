import Link from 'next/link';
import { getRole, prisma } from '@reelworx/shared/server';
import {
  FIT_DIMENSION_LABELS,
  FIT_DIMENSIONS,
  type FitDimension,
  type IdealProfile,
} from '@reelworx/shared';

export const dynamic = 'force-dynamic';

const avg = (xs: number[]) =>
  xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null;

// Reduce a dimension of the role's target to a 0-100 number (where meaningful) and a
// set of descriptor tags (for skills/values).
function dimensionView(ideal: IdealProfile, dim: FitDimension): {
  score: number | null;
  tags: string[];
} {
  switch (dim) {
    case 'personality':
      return { score: avg(Object.values(ideal.personality ?? {})), tags: [] };
    case 'resilienceDrive':
      return { score: ideal.resilienceDrive?.gritScore ?? null, tags: [] };
    case 'emotionalIntelligence':
      return { score: avg(Object.values(ideal.emotionalIntelligence ?? {})), tags: [] };
    case 'skillsExperience':
      return { score: null, tags: ideal.skillsExperience?.translatedSkills ?? [] };
    case 'motivationValues':
      return { score: null, tags: ideal.motivationValues?.coreValues ?? [] };
  }
}

export default async function RoleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const role = await getRole(prisma, id);

  if (!role) {
    return (
      <main className="container" style={{ paddingTop: 64 }}>
        <p>Role not found. <Link href="/dashboard/roles" style={{ textDecoration: 'underline' }}>Back to roles</Link></p>
      </main>
    );
  }

  const ideal = (role.idealProfile ?? {}) as IdealProfile;
  const derived = Object.keys(ideal).length > 0;
  const hasVideo = role.reels.some((r) => r.videoUrl);
  const weights = ideal.weights ?? {};

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--gray-050)' }}>
      <header style={{ background: 'var(--white)', borderBottom: '1px solid var(--gray-100)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: 64 }}>
          <Link href="/dashboard/roles" className="display" style={{ fontSize: 22 }}>
            ‹ Roles
          </Link>
        </div>
        <div className="spectrum-bar" style={{ borderRadius: 0 }} />
      </header>

      <section className="container" style={{ paddingTop: 40, paddingBottom: 64, display: 'grid', gap: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{role.title}</h1>
            <p className="muted" style={{ marginTop: 6 }}>
              {role.location ?? 'Location flexible'} ·{' '}
              {hasVideo ? 'Video-first listing' : 'No video yet — add one for a realistic preview'}
            </p>
          </div>
          <Link href={`/dashboard/roles/${role.id}/matches`} className="btn btn-spectrum">
            See suggested people →
          </Link>
        </div>

        <div className="card" style={{ maxWidth: 760 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>
            The human profile this role needs
          </h2>
          <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>
            Derived from your description. Candidates are read against this — same five
            dimensions, both sides.
          </p>

          {!derived ? (
            <p className="muted" style={{ marginTop: 16 }}>
              Not derived yet. Set <code>ANTHROPIC_API_KEY</code> and recreate the role,
              or it will be filled when the Fit Read runs.
            </p>
          ) : (
            <div style={{ marginTop: 16, display: 'grid', gap: 16 }}>
              {FIT_DIMENSIONS.map((dim) => {
                const { score, tags } = dimensionView(ideal, dim);
                const weight = weights[dim];
                return (
                  <div key={dim}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{FIT_DIMENSION_LABELS[dim]}</span>
                      {typeof weight === 'number' ? (
                        <span className="muted" style={{ fontSize: 12 }}>weight {Math.round(weight)}</span>
                      ) : null}
                    </div>
                    {score !== null ? (
                      <div style={{ marginTop: 6, height: 8, borderRadius: 999, background: 'var(--gray-100)', overflow: 'hidden' }}>
                        <div style={{ width: `${score}%`, height: '100%', background: 'var(--spectrum)' }} />
                      </div>
                    ) : tags.length ? (
                      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {tags.map((t) => (
                          <span
                            key={t}
                            style={{
                              fontSize: 13,
                              padding: '4px 10px',
                              borderRadius: 999,
                              background: 'var(--gray-050)',
                              border: '1px solid var(--gray-100)',
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="muted" style={{ margin: '6px 0 0', fontSize: 13 }}>Not specified for this role.</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card" style={{ maxWidth: 760 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>What the role involves</h2>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{role.description}</p>
        </div>
      </section>
    </main>
  );
}
