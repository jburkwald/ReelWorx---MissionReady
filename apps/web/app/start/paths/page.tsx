import Link from 'next/link';
import { DEMO_PATHS } from '@reelworx/shared';

export const dynamic = 'force-dynamic';

// Path Discovery (2.1) — for someone who doesn't yet know who they become next. Leads
// with careers they never pictured, each with a plain "why this fits", and the honest
// gap + how to close it. (Demo suggestions in preview; generated from the real profile
// once the story is built.)
export default function CandidatePaths() {
  return (
    <main style={{ flex: 1, padding: '22px 20px 40px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/start" style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-700)' }}>
          ‹ Back
        </Link>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.4, color: 'var(--gray-400)' }}>
          PATH DISCOVERY
        </span>
      </div>

      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.4, margin: 0 }}>
          Paths you might not have pictured.
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--gray-700)', marginTop: 8 }}>
          Cross-wired from who you actually are — not keyword matches. Here’s why each
          one fits, and what it would take.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {DEMO_PATHS.map((p) => (
          <div
            key={p.id}
            style={{
              border: '1px solid var(--gray-100)',
              borderRadius: 'var(--radius-lg)',
              padding: 18,
              background: 'var(--white)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
              <div>
                <h2 style={{ fontSize: 19, fontWeight: 800, margin: 0 }}>{p.title}</h2>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--gray-400)' }}>{p.sector}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{p.fitScore}%</div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 700, letterSpacing: 0.3 }}>FIT</div>
              </div>
            </div>

            <div style={{ marginTop: 10, height: 6, borderRadius: 999, background: 'var(--gray-100)', overflow: 'hidden' }}>
              <div style={{ width: `${p.fitScore}%`, height: '100%', background: 'var(--spectrum)' }} />
            </div>

            <p style={{ marginTop: 14, fontSize: 14.5, lineHeight: 1.55 }}>{p.whyThisFits}</p>

            {p.gap ? (
              <div
                style={{
                  marginTop: 12,
                  background: 'var(--gray-050)',
                  borderRadius: 'var(--radius-md)',
                  padding: 12,
                }}
              >
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>To go further: {p.gap}</p>
                {p.bridge ? (
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--gray-700)', lineHeight: 1.5 }}>
                    {p.bridge}
                  </p>
                ) : null}
              </div>
            ) : (
              <p style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: 'var(--brand-blue, #1d4ed8)' }}>
                You’re ready for this one today.
              </p>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn btn-spectrum" style={{ height: 42, flex: 1 }}>
                Explore this
              </button>
              <button className="btn btn-ghost" style={{ height: 42 }}>
                Not for me
              </button>
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 12.5, color: 'var(--gray-400)', textAlign: 'center' }}>
        Saying “not for me” teaches the system and sharpens what it shows you next.
      </p>
    </main>
  );
}
