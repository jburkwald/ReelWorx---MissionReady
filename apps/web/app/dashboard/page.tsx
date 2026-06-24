import type { CSSProperties } from 'react';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { BRAND } from '@reelworx/shared';
import { getReadyInviteBalance, prisma } from '@reelworx/shared/server';
import { getOrProvisionUser } from '../../lib/db-user';
import { createOrganization } from './actions';

// Protected by clerkMiddleware (proxy.ts → auth.protect on /dashboard).
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  let dbUser: Awaited<ReturnType<typeof getOrProvisionUser>> = null;
  let dbUnavailable = false;
  try {
    dbUser = await getOrProvisionUser();
  } catch {
    dbUnavailable = true; // almost always: DATABASE_URL not set yet
  }

  const org = dbUser?.organizationAdmins[0]?.organization ?? null;
  const greeting = dbUser?.email?.split('@')[0] ?? 'there';

  let tokenBalance = 0;
  if (org) {
    try {
      tokenBalance = await getReadyInviteBalance(prisma, org.id);
    } catch {
      /* leave at 0 if the token grant can't be read */
    }
  }

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--gray-050)' }}>
      <header style={{ background: 'var(--white)', borderBottom: '1px solid var(--gray-100)' }}>
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 64,
          }}
        >
          <Link href="/" className="display" style={{ fontSize: 22 }}>
            {BRAND.product}
          </Link>
          <UserButton />
        </div>
        <div className="spectrum-bar" style={{ borderRadius: 0 }} />
      </header>

      <section className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>
        {dbUnavailable ? (
          <DatabaseBanner />
        ) : !org ? (
          <PlantFlag greeting={greeting} />
        ) : (
          <Workspace orgName={org.name} greeting={greeting} tokenBalance={tokenBalance} />
        )}

        {dbUser ? (
          <p className="muted" style={{ marginTop: 40, fontSize: 13 }}>
            Signed in as {dbUser.email} · role: {dbUser.role}
          </p>
        ) : null}
      </section>
    </main>
  );
}

function DatabaseBanner() {
  return (
    <div className="card" style={{ maxWidth: 620, borderColor: 'var(--spectrum-orange)' }}>
      <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>
        Connect your database
      </h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Auth is working — but the company workspace needs Postgres. Add a{' '}
        <code>DATABASE_URL</code> (Supabase) to <code>.env</code>, run{' '}
        <code>npm run db:push</code>, and reload.
      </p>
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: '100%',
  height: 48,
  borderRadius: 14,
  border: '1px solid var(--gray-100)',
  background: 'var(--white)',
  padding: '0 14px',
  fontSize: 15,
  fontFamily: 'var(--font-body)',
  marginTop: 6,
};

function PlantFlag({ greeting }: { greeting: string }) {
  return (
    <>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Welcome, {greeting}.</h1>
      <p className="muted" style={{ marginTop: 6 }}>
        Plant your flag — set up your company workspace.
      </p>
      <form action={createOrganization} className="card" style={{ marginTop: 24, maxWidth: 560 }}>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 600 }}>
          Company name
          <input name="name" required placeholder="e.g. Ridgeline Logistics" style={inputStyle} />
        </label>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginTop: 18 }}>
          Your veteran-hiring commitment{' '}
          <span className="muted" style={{ fontWeight: 400 }}>(your planted flag)</span>
          <textarea
            name="plantedFlag"
            rows={3}
            placeholder="Why your company is committed to hiring those who served."
            style={{ ...inputStyle, height: 'auto', paddingTop: 12, resize: 'vertical' }}
          />
        </label>
        <button type="submit" className="btn btn-spectrum" style={{ marginTop: 18 }}>
          Plant your flag
        </button>
      </form>
    </>
  );
}

function Workspace({
  orgName,
  greeting,
  tokenBalance,
}: {
  orgName: string;
  greeting: string;
  tokenBalance: number;
}) {
  return (
    <>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Welcome, {greeting}.</h1>
      <p className="muted" style={{ marginTop: 6 }}>
        {orgName} — your workspace is set up.
      </p>
      <div
        style={{
          marginTop: 28,
          display: 'grid',
          gap: 20,
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        }}
      >
        <Link href="/dashboard/roles" className="card" style={{ display: 'block', borderColor: 'var(--spectrum-blue)' }}>
          <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>Your roles</h3>
          <p className="muted" style={{ margin: 0 }}>
            Create video-first roles; we read the human profile each one needs.
          </p>
          <p style={{ marginTop: 14, fontSize: 13, fontWeight: 600, color: 'var(--spectrum-blue)' }}>
            Open roles →
          </p>
        </Link>
        <Link href="/dashboard/roles" className="card" style={{ display: 'block', borderColor: 'var(--spectrum-violet)' }}>
          <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>Suggested people</h3>
          <p className="muted" style={{ margin: 0 }}>
            High-intent candidates, decoded and fit-read. Open a role to see who fits.
          </p>
          <p style={{ marginTop: 14, fontSize: 13, fontWeight: 600, color: 'var(--spectrum-violet)' }}>
            Read the fit →
          </p>
        </Link>
        <Link href="/dashboard/people" className="card" style={{ display: 'block', borderColor: 'var(--spectrum-green)' }}>
          <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>Find people</h3>
          <p className="muted" style={{ margin: 0 }}>
            Search by skill and filter by hometown roots — bring talent back to your region.
          </p>
          <p style={{ marginTop: 14, fontSize: 13, fontWeight: 600, color: 'var(--spectrum-green)' }}>
            Come-home search →
          </p>
        </Link>
        <Link href="/dashboard/insights" className="card" style={{ display: 'block', borderColor: 'var(--spectrum-indigo)' }}>
          <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>Insights</h3>
          <p className="muted" style={{ margin: 0 }}>
            Proof it’s working — people surfaced, reach-outs, and conversations in one view.
          </p>
          <p style={{ marginTop: 14, fontSize: 13, fontWeight: 600, color: 'var(--spectrum-indigo)' }}>
            See insights →
          </p>
        </Link>
        <Link href="/dashboard/champions" className="card" style={{ display: 'block', borderColor: 'var(--spectrum-red)' }}>
          <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>Champion on-ramp</h3>
          <p className="muted" style={{ margin: 0 }}>
            Give TAP/VA/USO counselors an invite link and QR — and trace who they bring in.
          </p>
          <p style={{ marginTop: 14, fontSize: 13, fontWeight: 600, color: 'var(--spectrum-red)' }}>
            Manage champions →
          </p>
        </Link>
        <Link href="/dashboard/alerts" className="card" style={{ display: 'block', borderColor: 'var(--spectrum-yellow)' }}>
          <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>New-people alerts</h3>
          <p className="muted" style={{ margin: 0 }}>
            Save the kind of person you want more of, and see when new ones arrive.
          </p>
          <p style={{ marginTop: 14, fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>
            Manage alerts →
          </p>
        </Link>
        <Link href="/dashboard/studio" className="card" style={{ display: 'block', borderColor: 'var(--spectrum-orange)' }}>
          <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>Story Studio <span className="muted" style={{ fontSize: 12, fontWeight: 600 }}>Beta</span></h3>
          <p className="muted" style={{ margin: 0 }}>
            Make your own story Reels from polished themes — drop in footage or a link.
          </p>
          <p style={{ marginTop: 14, fontSize: 13, fontWeight: 600, color: 'var(--spectrum-orange)' }}>
            Open the studio →
          </p>
        </Link>
        <div className="card">
          <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>Outreach tokens</h3>
          <p className="muted" style={{ margin: 0 }}>
            Your monthly allotment. Spend them deliberately — reaching out should mean something.
          </p>
          <p style={{ marginTop: 14, fontSize: 28, fontWeight: 800 }}>
            {tokenBalance}{' '}
            <span className="muted" style={{ fontSize: 14, fontWeight: 600 }}>
              left this month
            </span>
          </p>
        </div>
      </div>
    </>
  );
}
