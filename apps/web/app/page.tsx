import Link from 'next/link';
import { Show } from '@clerk/nextjs';
import { BRAND } from '@reelworx/shared';

// Public planted-flag home for companies (Karen). Calm Apple structure; the single
// Wrapped moment is the spectrum-gradient headline. Exploration is free by design —
// nothing here is gated.
export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <main>
      <header className="container" style={{ paddingTop: 28, paddingBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="display" style={{ fontSize: 26 }}>
            {BRAND.product}
          </span>
          <nav style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Show when="signed-out">
              <Link href="/sign-in" className="btn btn-ghost">
                Sign in
              </Link>
              <Link href="/sign-up" className="btn btn-primary">
                Create company account
              </Link>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard" className="btn btn-primary">
                Go to dashboard
              </Link>
            </Show>
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
          <Show when="signed-out">
            <Link href="/sign-up" className="btn btn-spectrum">
              Plant your flag
            </Link>
            <Link href="/sign-in" className="btn btn-ghost">
              I already have an account
            </Link>
          </Show>
          <Show when="signed-in">
            <Link href="/dashboard" className="btn btn-spectrum">
              Open your dashboard
            </Link>
          </Show>
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

      <footer className="container" style={{ paddingBottom: 48 }}>
        <p className="muted" style={{ fontSize: 13 }}>
          {BRAND.product} · Made for the ones who served. Built for everyone who connects.
        </p>
      </footer>
    </main>
  );
}
