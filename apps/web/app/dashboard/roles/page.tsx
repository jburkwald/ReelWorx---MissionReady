import Link from 'next/link';
import { listRolesForOrg, prisma } from '@reelworx/shared/server';
import { getOrProvisionUser } from '../../../lib/db-user';

export const dynamic = 'force-dynamic';

export default async function RolesPage() {
  let user: Awaited<ReturnType<typeof getOrProvisionUser>> = null;
  let dbDown = false;
  try {
    user = await getOrProvisionUser();
  } catch {
    dbDown = true;
  }
  const org = user?.organizationAdmins[0]?.organization ?? null;

  let roles: Awaited<ReturnType<typeof listRolesForOrg>> = [];
  if (org) {
    try {
      roles = await listRolesForOrg(prisma, org.id);
    } catch {
      dbDown = true;
    }
  }

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--gray-050)' }}>
      <header style={{ background: 'var(--white)', borderBottom: '1px solid var(--gray-100)' }}>
        <div
          className="container"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}
        >
          <Link href="/dashboard" className="display" style={{ fontSize: 22 }}>
            ReelWorx · Roles
          </Link>
          {org ? (
            <Link href="/dashboard/roles/new" className="btn btn-spectrum">
              New role
            </Link>
          ) : null}
        </div>
        <div className="spectrum-bar" style={{ borderRadius: 0 }} />
      </header>

      <section className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>
        {dbDown ? (
          <div className="card" style={{ maxWidth: 620, borderColor: 'var(--spectrum-orange)' }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>Connect your database</h2>
            <p className="muted" style={{ marginTop: 0 }}>
              Add <code>DATABASE_URL</code> to <code>.env</code> and run <code>npm run db:push</code> to manage roles.
            </p>
          </div>
        ) : !org ? (
          <div className="card" style={{ maxWidth: 560 }}>
            <p style={{ margin: 0 }}>
              Plant your flag first. <Link href="/dashboard" style={{ textDecoration: 'underline' }}>Go to dashboard →</Link>
            </p>
          </div>
        ) : roles.length === 0 ? (
          <div className="card" style={{ maxWidth: 560 }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>No roles yet</h2>
            <p className="muted" style={{ marginTop: 0 }}>
              Create a video-first role and we&apos;ll read the human profile it needs.
            </p>
            <Link href="/dashboard/roles/new" className="btn btn-spectrum">
              Create your first role
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {roles.map((role) => {
              const hasVideo = role.reels.some((r) => r.videoUrl);
              return (
                <Link key={role.id} href={`/dashboard/roles/${role.id}`} className="card" style={{ display: 'block' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{role.title}</h3>
                      <p className="muted" style={{ margin: '4px 0 0', fontSize: 14 }}>
                        {role.location ?? 'Location flexible'}
                      </p>
                    </div>
                    <span
                      className="muted"
                      style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.4 }}
                    >
                      {hasVideo ? 'VIDEO-FIRST' : 'ADD A VIDEO'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
