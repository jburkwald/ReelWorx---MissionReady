import Link from 'next/link';
import { headers } from 'next/headers';
import { listChampions, prisma, type ChampionView } from '@reelworx/shared/server';
import { createChampionAction } from './actions';

export const dynamic = 'force-dynamic';

// Champion On-Ramp admin (Feature 8.1). Register a counselor's office, hand them an invite
// link (print a QR from it), and watch members come in. QR-image rendering is a deliberate
// follow-on — the link is the on-ramp; the office can generate a QR from it today.
export default async function ChampionsPage() {
  let champions: ChampionView[] = [];
  let dbDown = false;
  try {
    champions = await listChampions(prisma);
  } catch {
    dbDown = true;
  }

  const h = await headers();
  const origin =
    h.get('origin') ?? (h.get('host') ? `https://${h.get('host')}` : '');

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--gray-050)' }}>
      <header style={{ background: 'var(--white)', borderBottom: '1px solid var(--gray-100)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: 64 }}>
          <Link href="/dashboard" className="display" style={{ fontSize: 22 }}>
            ReelWorx · Champions
          </Link>
        </div>
        <div className="spectrum-bar" style={{ borderRadius: 0 }} />
      </header>

      <section className="container" style={{ paddingTop: 40, paddingBottom: 64, display: 'grid', gap: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Champion on-ramp</h1>
          <p className="muted" style={{ marginTop: 6, maxWidth: 560 }}>
            Counselors at TAP, the VA, and the USO are how most members find their footing.
            Give an office a link (and a printed QR) and every member who joins through it is
            traced back to them.
          </p>
        </div>

        <form action={createChampionAction} className="card" style={{ maxWidth: 620, display: 'grid', gap: 14 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>
            Office name
            <input name="officeName" required placeholder="e.g. Fort Liberty TAP Center" style={inputStyle} />
          </label>
          <label style={{ fontSize: 14, fontWeight: 600 }}>
            Counselor email
            <input name="email" type="email" required placeholder="counselor@example.gov" style={inputStyle} />
          </label>
          <div>
            <button type="submit" className="btn btn-spectrum">Create invite link</button>
          </div>
        </form>

        {dbDown ? (
          <div className="card" style={{ maxWidth: 620, borderColor: 'var(--spectrum-orange)' }}>
            <p className="muted" style={{ margin: 0 }}>
              Add a <code>DATABASE_URL</code> and run <code>npm run db:push</code> to manage champions.
            </p>
          </div>
        ) : champions.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>No champions yet — register an office above.</p>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {champions.map((c) => (
              <div key={c.advocateId} className="card" style={{ maxWidth: 760 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{c.officeName ?? c.email}</h3>
                    <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>{c.email}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1 }}>{c.referred}</div>
                    <div className="muted" style={{ fontSize: 12, fontWeight: 600 }}>members joined</div>
                  </div>
                </div>
                {c.code ? (
                  <p style={{ margin: '14px 0 0', fontSize: 14 }}>
                    <span className="muted">Invite link: </span>
                    <code style={{ fontSize: 13 }}>{origin}/c/{c.code}</code>
                  </p>
                ) : null}
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
