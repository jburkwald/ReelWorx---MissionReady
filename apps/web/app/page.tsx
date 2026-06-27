import Link from 'next/link';
import { BRAND } from '@reelworx/shared';
import { isDbConfigured } from '@reelworx/shared/server';

// Public planted-flag home for companies (Karen). Calm Apple structure; the single
// Wrapped moment is the spectrum-gradient headline. Exploration is free by design —
// nothing here is gated.
export const dynamic = 'force-dynamic';

export default function HomePage() {
  const demo = !isDbConfigured();
  return (
    <main>
      {demo ? <DemoLaunchpad /> : null}
      <header className="container" style={{ paddingTop: 28, paddingBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="display" style={{ fontSize: 26 }}>
            {BRAND.product}
          </span>
          <nav style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link href="/start" className="btn btn-ghost">
              For veterans
            </Link>
            <Link href="/jobs" className="btn btn-ghost">
              Browse jobs
            </Link>
            <Link href="/sign-in" className="btn btn-ghost">
              Sign in
            </Link>
            <Link href="/sign-up" className="btn btn-primary">
              Create company account
            </Link>
          </nav>
        </div>
      </header>

      <section className="container" style={{ paddingTop: 64, paddingBottom: 40 }}>
        <p
          className="muted"
          style={{ fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 13 }}
        >
          For companies who planted their flag
        </p>
        <h1
          className="display spectrum-text"
          style={{ fontSize: 'clamp(52px, 9vw, 120px)', margin: '14px 0 0' }}
        >
          Hire the ones
          <br />
          who served.
        </h1>
        <p style={{ fontSize: 20, maxWidth: 620, marginTop: 24, color: 'var(--gray-700)' }}>
          Meet people through story and a science-backed fit read — not resumes and
          keyword search. Fewer, higher-intent candidates, decoded into plain
          business language so you can decide to reach out or pass.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
          <Link href="/jobs" className="btn btn-spectrum">
            Browse open roles
          </Link>
          <Link href="/sign-up" className="btn btn-ghost">
            Plant your flag (for companies)
          </Link>
        </div>
        <div className="spectrum-bar" style={{ marginTop: 56, maxWidth: 320 }} />
      </section>

      <section className="container" style={{ paddingTop: 40, paddingBottom: 96 }}>
        <div
          style={{
            display: 'grid',
            gap: 20,
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          }}
        >
          {[
            {
              t: 'Signal, not volume',
              d: 'Outreach costs an intent token, so every candidate you see is a real one. Scarcity is the signal.',
            },
            {
              t: 'Decoded credibility',
              d: 'Military experience translated into business terms — the leadership, the scope, the proof — so you can trust the fit and move.',
            },
            {
              t: 'A fit read, dimension by dimension',
              d: 'Your role becomes a profile of what it actually needs, and people are scored against it in plain language.',
            },
          ].map((f) => (
            <div className="card" key={f.t}>
              <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>{f.t}</h3>
              <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
                {f.d}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="container" style={{ paddingBottom: 48, display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>
          {BRAND.product} · Made for the ones who served. Built for everyone who connects.
        </p>
        <Link href="/start" className="muted" style={{ fontSize: 13, fontWeight: 600, textDecoration: 'underline' }}>
          Leaving the service? Start here →
        </Link>
      </footer>
    </main>
  );
}

// Shown only in keyless demo mode (no DATABASE_URL): a single, obvious place to walk the
// FULL product — Marcus's mobile-shaped candidate journey and Karen's company dashboard —
// with no sign-in and no setup. Disappears the moment a real backend is configured.
function DemoLaunchpad() {
  return (
    <div style={{ background: 'var(--black)', color: 'var(--white)' }}>
      <div className="container" style={{ paddingTop: 24, paddingBottom: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.85)',
              border: '1px solid rgba(255,255,255,0.22)',
              borderRadius: 'var(--radius-full)',
              padding: '5px 12px',
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--brand-red)' }} />
            Demo mode · no sign-in, sample data
          </span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
            Walk the whole thing. Both sides are live below.
          </span>
        </div>

        <div
          style={{
            marginTop: 16,
            display: 'grid',
            gap: 14,
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          }}
        >
          <Link
            href="/start"
            style={{
              display: 'block',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(255,255,255,0.16)',
              background: 'rgba(255,255,255,0.04)',
              padding: 18,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--brand-red)' }}>
              VETERAN APP · MARCUS
            </div>
            <div style={{ fontSize: 19, fontWeight: 800, marginTop: 6 }}>Enter the veteran experience →</div>
            <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.72)', marginTop: 6, lineHeight: 1.5 }}>
              The mobile-shaped journey: tell your story, discover paths, get seen — no resume.
            </div>
          </Link>

          <Link
            href="/dashboard"
            style={{
              display: 'block',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(255,255,255,0.16)',
              background: 'rgba(255,255,255,0.04)',
              padding: 18,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: '#7da2ff' }}>
              COMPANY DASHBOARD · KAREN
            </div>
            <div style={{ fontSize: 19, fontWeight: 800, marginTop: 6 }}>Enter the company experience →</div>
            <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.72)', marginTop: 6, lineHeight: 1.5 }}>
              Ridgeline Logistics’ workspace: roles, the Fit Read, people search, insights, champions.
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
