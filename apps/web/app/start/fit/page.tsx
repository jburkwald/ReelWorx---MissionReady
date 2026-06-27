import Link from 'next/link';
import { getCandidateFitReads, prisma, type CandidateFitRead } from '@reelworx/shared/server';

export const dynamic = 'force-dynamic';

// Candidate-side Fit Read (Feature 2.2, Dana's view): companies that suit YOU, each with a
// plain reason and the one honest place to grow. Keyless demo renders sample reads.
export default async function CandidateFit() {
  let reads: CandidateFitRead[] = [];
  try {
    reads = await getCandidateFitReads(prisma, 'demo-cand-marcus');
  } catch {
    reads = [];
  }

  return (
    <main style={{ flex: 1, padding: '22px 20px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/start" style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-700)' }}>
          ‹ Back
        </Link>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.4, color: 'var(--gray-400)' }}>
          YOUR FIT READ
        </span>
      </div>

      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.4, margin: 0 }}>
          Companies that suit you.
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--gray-700)', marginTop: 8 }}>
          Read against who you actually are, not keywords. Here is why each one fits, and the
          one place to grow.
        </p>
      </div>

      {reads.length === 0 ? (
        <div className="card" style={{ background: 'var(--gray-050)' }}>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--gray-700)' }}>
            Build your story first and your matches will appear here.{' '}
            <Link href="/start/story" style={{ fontWeight: 700, textDecoration: 'underline' }}>
              Start your profile ›
            </Link>
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reads.map((r) => (
            <div
              key={r.roleId}
              style={{ border: '1px solid var(--gray-100)', borderRadius: 'var(--radius-lg)', padding: 16, background: 'var(--white)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: 0.3, color: 'var(--gray-400)' }}>
                    {r.company.toUpperCase()}
                  </p>
                  <h2 style={{ fontSize: 18, fontWeight: 800, margin: '3px 0 0' }}>{r.roleTitle}</h2>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--gray-400)' }}>
                    {r.location ?? 'Location flexible'}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div
                    className={r.tier.celebratory ? 'display spectrum-text' : undefined}
                    style={{ fontSize: r.tier.celebratory ? 34 : 26, fontWeight: 800, lineHeight: 1, color: r.tier.celebratory ? undefined : 'var(--gray-900)' }}
                  >
                    {r.overall}%
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.3, color: 'var(--gray-400)', textTransform: 'uppercase' }}>
                    {r.tier.label}
                  </div>
                </div>
              </div>

              <p style={{ margin: '12px 0 0', fontSize: 14.5, lineHeight: 1.5 }}>{r.why}</p>
              {r.gap ? (
                <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--gray-700)', background: 'var(--gray-050)', borderRadius: 'var(--radius-md)', padding: '8px 12px' }}>
                  {r.gap}
                </p>
              ) : null}

              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <Link href={`/jobs/${r.roleId}`} className="btn btn-spectrum" style={{ height: 40, flex: 1 }}>
                  See the role
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 12.5, color: 'var(--gray-400)', textAlign: 'center' }}>
        Reaching out costs an intent token, so when you do, it means something.
      </p>
    </main>
  );
}
