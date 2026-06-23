import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { currentUser } from '@clerk/nextjs/server';
import { BRAND, type UserRole } from '@reelworx/shared';
import { setCompanyRole } from './actions';

// Protected by middleware (clerkMiddleware → auth.protect on /dashboard).
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await currentUser();
  const role = user?.publicMetadata?.role as UserRole | undefined;
  const greetingName =
    user?.firstName ?? user?.emailAddresses[0]?.emailAddress ?? 'there';
  const isCompany = role === 'company_admin';

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--gray-050)' }}>
      <header
        style={{
          background: 'var(--white)',
          borderBottom: '1px solid var(--gray-100)',
        }}
      >
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
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>
          Welcome, {greetingName}.
        </h1>
        <p className="muted" style={{ marginTop: 6 }}>
          {isCompany
            ? 'Your company workspace is set up.'
            : 'One step to finish setting up your company workspace.'}
        </p>

        {!isCompany ? (
          <div className="card" style={{ marginTop: 28, maxWidth: 560 }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>
              Plant your flag
            </h2>
            <p className="muted" style={{ marginTop: 0 }}>
              Confirm you&apos;re a company hiring those who served. This sets your
              role so the company-side tools unlock.
            </p>
            <form action={setCompanyRole}>
              <button type="submit" className="btn btn-spectrum">
                I&apos;m a hiring company
              </button>
            </form>
          </div>
        ) : (
          <div
            style={{
              marginTop: 28,
              display: 'grid',
              gap: 20,
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            }}
          >
            {[
              ['Your stories', 'Create job and culture Reels from beta themes.'],
              ['Suggested people', 'High-intent candidates, decoded and fit-read.'],
              ['Outreach tokens', 'Your monthly allotment. Spend them deliberately.'],
            ].map(([t, d]) => (
              <div className="card" key={t}>
                <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>{t}</h3>
                <p className="muted" style={{ margin: 0 }}>
                  {d}
                </p>
                <p
                  className="muted"
                  style={{ marginTop: 14, fontSize: 12, letterSpacing: '0.04em' }}
                >
                  COMING IN THE NEXT BUILD PHASE
                </p>
              </div>
            ))}
          </div>
        )}

        <p className="muted" style={{ marginTop: 40, fontSize: 13 }}>
          Signed in as {user?.emailAddresses[0]?.emailAddress} · role:{' '}
          {role ?? 'pending'}
        </p>
      </section>
    </main>
  );
}
