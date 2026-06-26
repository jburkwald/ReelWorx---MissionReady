import Link from 'next/link';
import { BRAND, DEMO_JOBS, type PublicJob } from '@reelworx/shared';
import { listPublishedJobs, prisma } from '@reelworx/shared/server';

// PUBLIC — no auth, no profile. Browse jobs like a public board (ReelWorx.jobs style).
export const dynamic = 'force-dynamic';

export default async function JobsPage() {
  let jobs: PublicJob[] = [];
  let sample = false;
  try {
    jobs = await listPublishedJobs(prisma);
  } catch {
    // No database connected (preview mode) — show sample listings so the experience
    // is visible immediately.
    jobs = DEMO_JOBS;
    sample = true;
  }

  return (
    <main style={{ minHeight: '100dvh' }}>
      <header style={{ borderBottom: '1px solid var(--gray-100)' }}>
        <div
          className="container"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}
        >
          <Link href="/" className="display" style={{ fontSize: 24 }}>
            {BRAND.product}
          </Link>
          <nav style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Link href="/jobs" style={{ fontWeight: 700, fontSize: 14 }}>
              Browse jobs
            </Link>
            <Link href="/" className="btn btn-ghost">
              For companies
            </Link>
          </nav>
        </div>
        <div className="spectrum-bar" style={{ borderRadius: 0 }} />
      </header>

      <section className="container" style={{ paddingTop: 48, paddingBottom: 24 }}>
        <h1 className="display" style={{ fontSize: 'clamp(40px, 7vw, 76px)', margin: 0 }}>
          Open roles
        </h1>
        <p style={{ fontSize: 18, color: 'var(--gray-700)', marginTop: 12, maxWidth: 620 }}>
          Wander freely — no account needed. Every role is told as a story, by a company
          that planted its flag to hire those who served.
        </p>
        {sample ? (
          <p
            className="muted"
            style={{ marginTop: 12, fontSize: 13, fontWeight: 600, letterSpacing: 0.3 }}
          >
            SAMPLE LISTINGS · connect a database (and seed) to see live roles
          </p>
        ) : null}
      </section>

      <section className="container" style={{ paddingBottom: 96 }}>
        {jobs.length === 0 ? (
          <div className="card" style={{ maxWidth: 560 }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>No open roles yet</h2>
            <p className="muted" style={{ margin: 0 }}>
              Check back soon — companies are planting their flags.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gap: 18,
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            }}
          >
            {jobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`} className="card" style={{ display: 'block' }}>
                <div
                  style={{
                    height: 132,
                    margin: '-28px -28px 18px',
                    borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                    background: job.videoUrl ? 'var(--black)' : 'var(--spectrum)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: 13, letterSpacing: 0.5, opacity: 0.95 }}>
                    {job.videoUrl ? '▶ WATCH THE STORY' : 'VIDEO-FIRST ROLE'}
                  </span>
                </div>
                <p className="muted" style={{ margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: 0.3 }}>
                  {job.company.toUpperCase()}
                </p>
                <h3 style={{ margin: '4px 0 6px', fontSize: 19, fontWeight: 700 }}>{job.title}</h3>
                <p className="muted" style={{ margin: '0 0 10px', fontSize: 14 }}>
                  {job.location ?? 'Location flexible'}
                </p>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'var(--gray-700)' }}>
                  {job.blurb}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
