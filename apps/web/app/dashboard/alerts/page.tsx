import Link from 'next/link';
import { listAlerts, prisma, type AlertView } from '@reelworx/shared/server';
import { getOrProvisionUser } from '../../../lib/db-user';
import { createAlertAction, deleteAlertAction, viewAlertAction } from './actions';

export const dynamic = 'force-dynamic';

// New-People Alerts (Feature 3.4). Save the kind of person you want more of; see when they
// arrive. Pull-based for now — the count refreshes whenever Karen looks.
export default async function AlertsPage() {
  let org: { id: string } | null = null;
  let alerts: AlertView[] = [];
  let dbDown = false;
  try {
    const user = await getOrProvisionUser();
    org = user?.organizationAdmins[0]?.organization ?? null;
    if (org) alerts = await listAlerts(prisma, org.id);
  } catch {
    dbDown = true;
  }

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--gray-050)' }}>
      <header style={{ background: 'var(--white)', borderBottom: '1px solid var(--gray-100)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: 64 }}>
          <Link href="/dashboard" className="display" style={{ fontSize: 22 }}>
            ReelWorx · Alerts
          </Link>
        </div>
        <div className="spectrum-bar" style={{ borderRadius: 0 }} />
      </header>

      <section className="container" style={{ paddingTop: 40, paddingBottom: 64, display: 'grid', gap: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>New-people alerts</h1>
          <p className="muted" style={{ marginTop: 6, maxWidth: 560 }}>
            Save the kind of person you want more of — by skill, by hometown, or both — and
            see at a glance when new ones arrive.
          </p>
        </div>

        <form action={createAlertAction} className="card" style={{ maxWidth: 760, display: 'grid', gap: 14 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>
            Name this alert <span className="muted" style={{ fontWeight: 400 }}>(optional)</span>
            <input name="label" placeholder="e.g. Ohio operations leaders" style={inputStyle} />
          </label>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <label style={{ flex: '1 1 240px', fontSize: 14, fontWeight: 600 }}>
              Keyword
              <input name="keyword" placeholder="e.g. logistics" style={inputStyle} />
            </label>
            <label style={{ flex: '1 1 200px', fontSize: 14, fontWeight: 600 }}>
              Roots / hometown
              <input name="place" placeholder="e.g. Columbus, OH" style={inputStyle} />
            </label>
          </div>
          <div>
            <button type="submit" className="btn btn-spectrum">Save alert</button>
          </div>
        </form>

        {dbDown ? (
          <div className="card" style={{ maxWidth: 620, borderColor: 'var(--spectrum-orange)' }}>
            <p className="muted" style={{ margin: 0 }}>Connect a database to save alerts.</p>
          </div>
        ) : alerts.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>No alerts yet — save one above.</p>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {alerts.map((a) => (
              <div key={a.id} className="card" style={{ maxWidth: 760, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{a.label}</h3>
                  <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>
                    {[a.keyword, a.place].filter(Boolean).join(' · ') || 'Any candidate'}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {a.newCount > 0 ? (
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--spectrum-green)' }}>
                      {a.newCount} new
                    </span>
                  ) : (
                    <span className="muted" style={{ fontSize: 13 }}>up to date</span>
                  )}
                  <form action={viewAlertAction.bind(null, a.id, a.keyword, a.place)}>
                    <button type="submit" className="btn btn-ghost">View</button>
                  </form>
                  <form action={deleteAlertAction.bind(null, a.id)}>
                    <button type="submit" className="btn btn-ghost" style={{ color: 'var(--gray-400)' }}>
                      Remove
                    </button>
                  </form>
                </div>
              </div>
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
