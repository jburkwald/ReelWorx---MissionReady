import Link from 'next/link';
import {
  getEmployerDashboard,
  prisma,
  type EmployerDashboard,
} from '@reelworx/shared/server';
import { getOrProvisionUser } from '../../../lib/db-user';

export const dynamic = 'force-dynamic';

// The Employer Dashboard (Feature 6.1) — Karen's "proof it's working." Reads real Match
// statuses + token spend; engagement → connection in one view.
export default async function InsightsPage() {
  let user: Awaited<ReturnType<typeof getOrProvisionUser>> = null;
  let dbDown = false;
  try {
    user = await getOrProvisionUser();
  } catch {
    dbDown = true;
  }
  const org = user?.organizationAdmins[0]?.organization ?? null;

  let data: EmployerDashboard | null = null;
  if (org) {
    try {
      data = await getEmployerDashboard(prisma, org.id);
    } catch {
      dbDown = true;
    }
  }

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--gray-050)' }}>
      <header style={{ background: 'var(--white)', borderBottom: '1px solid var(--gray-100)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: 64 }}>
          <Link href="/dashboard" className="display" style={{ fontSize: 22 }}>
            ReelWorx · Insights
          </Link>
        </div>
        <div className="spectrum-bar" style={{ borderRadius: 0 }} />
      </header>

      <section className="container" style={{ paddingTop: 40, paddingBottom: 64, display: 'grid', gap: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>How it’s working</h1>
          <p className="muted" style={{ marginTop: 6, maxWidth: 560 }}>
            Your sourcing at a glance — from the people we’ve surfaced to the intent you’ve spent.
          </p>
        </div>

        {dbDown || !data ? (
          <div className="card" style={{ maxWidth: 620, borderColor: 'var(--spectrum-orange)' }}>
            <p className="muted" style={{ margin: 0 }}>
              {org
                ? 'Add a DATABASE_URL and run db:push to see your insights.'
                : 'Plant your flag on the dashboard first.'}
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
              <Stat label="Open roles" value={data.openRoles} />
              <Stat label="People surfaced" value={data.candidatesSurfaced} />
              <Stat label="Reached out" value={data.reachedOut} accent />
              <Stat label="In conversation" value={data.connected} />
            </div>

            <div className="card" style={{ maxWidth: 760 }}>
              <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>Outreach tokens</h2>
              <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>
                Deliberate by design — scarcity is what keeps every reach-out meaningful.
              </p>
              <p style={{ margin: '8px 0 0', fontSize: 15 }}>
                <strong>{data.tokensLeft}</strong> left this month ·{' '}
                <span className="muted">{data.tokensSpentThisMonth} spent</span>
              </p>
            </div>

            <div className="card" style={{ maxWidth: 760 }}>
              <h2 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 700 }}>Recent reach-outs</h2>
              {data.recent.length === 0 ? (
                <p className="muted" style={{ margin: 0 }}>
                  No reach-outs yet. Open a role, run the Fit Read, and reach the people who fit.
                </p>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {data.recent.map((r, i) => (
                    <div
                      key={i}
                      style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingBottom: 10, borderBottom: i < data.recent.length - 1 ? '1px solid var(--gray-100)' : undefined }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{r.candidate}</span>
                      <span className="muted" style={{ fontSize: 13 }}>{r.roleTitle ?? '—'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="card" style={{ padding: 22 }}>
      <div
        className={accent ? 'display spectrum-text' : undefined}
        style={{ fontSize: 40, fontWeight: 800, lineHeight: 1, color: accent ? undefined : 'var(--gray-900)' }}
      >
        {value}
      </div>
      <div className="muted" style={{ marginTop: 6, fontSize: 13, fontWeight: 600 }}>{label}</div>
    </div>
  );
}
