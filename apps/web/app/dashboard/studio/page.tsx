import Link from 'next/link';
import { listStudioReels, prisma, type StudioReelView } from '@reelworx/shared/server';
import { STORY_THEMES, getStoryTheme } from '@reelworx/shared';
import { getOrProvisionUser } from '../../../lib/db-user';
import { createStudioReelAction } from './actions';

export const dynamic = 'force-dynamic';

// Self-Serve Story Studio, Beta (Feature 5.1). Pick a locked theme, drop in your footage or
// a link, and we assemble a story Reel — the brand stays the creative director.
export default async function StudioPage() {
  let org: { id: string } | null = null;
  let reels: StudioReelView[] = [];
  let dbDown = false;
  try {
    const user = await getOrProvisionUser();
    org = user?.organizationAdmins[0]?.organization ?? null;
    if (org) reels = await listStudioReels(prisma, org.id);
  } catch {
    dbDown = true;
  }

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--gray-050)' }}>
      <header style={{ background: 'var(--white)', borderBottom: '1px solid var(--gray-100)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: 64 }}>
          <Link href="/dashboard" className="display" style={{ fontSize: 22 }}>
            ReelWorx · Story Studio
          </Link>
        </div>
        <div className="spectrum-bar" style={{ borderRadius: 0 }} />
      </header>

      <section className="container" style={{ paddingTop: 40, paddingBottom: 64, display: 'grid', gap: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>
            Story Studio <span className="muted" style={{ fontSize: 15, fontWeight: 600 }}>· Beta</span>
          </h1>
          <p className="muted" style={{ marginTop: 6, maxWidth: 560 }}>
            Pick a theme, drop in your footage or a link to your site, and we assemble the
            story. Reliable by design — the theme is the frame, your content is the star.
          </p>
        </div>

        <form action={createStudioReelAction} className="card" style={{ maxWidth: 820, display: 'grid', gap: 18 }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 600 }}>1 · Choose a theme</span>
            <div style={{ marginTop: 10, display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              {STORY_THEMES.map((t, i) => (
                <label
                  key={t.id}
                  style={{
                    display: 'block',
                    border: '1px solid var(--gray-100)',
                    borderLeft: `4px solid var(--spectrum-${t.accent})`,
                    borderRadius: 12,
                    padding: 14,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="radio" name="themeId" value={t.id} defaultChecked={i === 0} required />
                    <strong style={{ fontSize: 15 }}>{t.name}</strong>
                  </span>
                  <span className="muted" style={{ display: 'block', marginTop: 4, fontSize: 13 }}>{t.tagline}</span>
                  <span className="muted" style={{ display: 'block', marginTop: 6, fontSize: 12 }}>Best with: {t.bestFor}</span>
                </label>
              ))}
            </div>
          </div>

          <label style={{ fontSize: 14, fontWeight: 600 }}>
            2 · Title
            <input name="title" required placeholder="e.g. A day on our logistics floor" style={inputStyle} />
          </label>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <label style={{ flex: '1 1 240px', fontSize: 14, fontWeight: 600 }}>
              Footage URL <span className="muted" style={{ fontWeight: 400 }}>(optional)</span>
              <input name="videoUrl" type="url" placeholder="https://… your video" style={inputStyle} />
            </label>
            <label style={{ flex: '1 1 240px', fontSize: 14, fontWeight: 600 }}>
              Or a site link <span className="muted" style={{ fontWeight: 400 }}>(optional)</span>
              <input name="sourceUrl" type="url" placeholder="https://yourcompany.com/careers" style={inputStyle} />
            </label>
          </div>
          <div>
            <button type="submit" className="btn btn-spectrum">Assemble the Reel</button>
          </div>
        </form>

        {dbDown ? (
          <div className="card" style={{ maxWidth: 620, borderColor: 'var(--spectrum-orange)' }}>
            <p className="muted" style={{ margin: 0 }}>Connect a database to use the studio.</p>
          </div>
        ) : reels.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>No Reels yet — assemble your first above.</p>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Your Reels</h2>
            {reels.map((r) => {
              const theme = r.themeId ? getStoryTheme(r.themeId) : undefined;
              return (
                <div
                  key={r.id}
                  className="card"
                  style={{ maxWidth: 760, borderLeft: `4px solid var(--spectrum-${theme?.accent ?? 'blue'})` }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{r.title}</h3>
                    {theme ? (
                      <span className="muted" style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>{theme.name}</span>
                    ) : null}
                  </div>
                  {r.caption ? <p style={{ margin: '8px 0 0', fontSize: 15, lineHeight: 1.5 }}>“{r.caption}”</p> : null}
                  {r.videoUrl ? (
                    <p className="muted" style={{ margin: '8px 0 0', fontSize: 13 }}>
                      Footage: <code style={{ fontSize: 12 }}>{r.videoUrl}</code>
                    </p>
                  ) : (
                    <p className="muted" style={{ margin: '8px 0 0', fontSize: 13 }}>No footage yet — add a video to bring it to life.</p>
                  )}
                </div>
              );
            })}
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
