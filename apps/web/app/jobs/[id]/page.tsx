import Link from 'next/link';
import { BRAND, DEMO_JOBS, type PublicJob } from '@reelworx/shared';
import { getPublishedJob, prisma } from '@reelworx/shared/server';

// PUBLIC job detail — no auth, no profile. The job's story (video-first), described
// honestly. Acting on it (building a profile, reaching out) happens in the app.
export const dynamic = 'force-dynamic';

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let job: PublicJob | null = null;
  if (id.startsWith('demo-')) {
    job = DEMO_JOBS.find((j) => j.id === id) ?? null;
  } else {
    try {
      job = await getPublishedJob(prisma, id);
    } catch {
      job = DEMO_JOBS.find((j) => j.id === id) ?? null;
    }
  }

  if (!job) {
    return (
      <main className="container" style={{ paddingTop: 80 }}>
        <p>
          This role isn&apos;t available.{' '}
          <Link href="/jobs" style={{ textDecoration: 'underline' }}>Browse open roles →</Link>
        </p>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100dvh' }}>
      <header style={{ borderBottom: '1px solid var(--gray-100)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: 64 }}>
          <Link href="/jobs" className="display" style={{ fontSize: 22 }}>
            ‹ {BRAND.product} · Jobs
          </Link>
        </div>
        <div className="spectrum-bar" style={{ borderRadius: 0 }} />
      </header>

      <article className="container" style={{ paddingTop: 32, paddingBottom: 96, maxWidth: 820 }}>
        {/* Video-first story */}
        <div
          style={{
            aspectRatio: '16 / 9',
            width: '100%',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            background: job.videoUrl ? 'var(--black)' : 'var(--spectrum)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {job.videoUrl ? (
            <video src={job.videoUrl} controls playsInline style={{ width: '100%', height: '100%' }} />
          ) : (
            <span style={{ color: '#fff', fontWeight: 700, letterSpacing: 0.5 }}>
              ▶ JOB STORY — VIDEO COMING
            </span>
          )}
        </div>

        <p className="muted" style={{ margin: '24px 0 0', fontSize: 14, fontWeight: 700, letterSpacing: 0.3 }}>
          {job.company.toUpperCase()}
        </p>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, margin: '6px 0 0' }}>
          {job.title}
        </h1>
        <p className="muted" style={{ marginTop: 8, fontSize: 16 }}>
          {job.location ?? 'Location flexible'}
        </p>

        <p style={{ marginTop: 28, fontSize: 17, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
          {job.description}
        </p>

        {/* Candidate action lives in the app (mobile-first), per the platform split. */}
        <div
          className="card"
          style={{
            marginTop: 40,
            background: 'var(--gray-050)',
            display: 'flex',
            gap: 16,
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700 }}>Interested?</h3>
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>
              Build your story profile in the app, then reach out with intent — no resume needed.
            </p>
          </div>
          <Link href="/join" className="btn btn-spectrum">
            Get started
          </Link>
        </div>
      </article>
    </main>
  );
}
