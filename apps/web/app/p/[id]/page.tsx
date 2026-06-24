import type { ReactNode } from 'react';
import Link from 'next/link';
import { getPublicProfile, prisma, type PublicProfile } from '@reelworx/shared/server';

export const dynamic = 'force-dynamic';

// The rich, shareable story render (Feature 1.3). A candidate sends this link anywhere —
// it tells their whole story. Wrapped energy is right here: this is a person, celebrated,
// not a spec sheet. The clean ATS version lives one click away at /p/[id]/resume.
export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let profile: PublicProfile | null = null;
  try {
    profile = await getPublicProfile(prisma, id);
  } catch {
    /* DB not reachable — fall through to not-found */
  }

  if (!profile) {
    return (
      <main className="container" style={{ paddingTop: 80 }}>
        <p className="muted">This profile isn’t available.</p>
      </main>
    );
  }

  const chips = (items: string[]) =>
    items.length ? (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {items.map((s) => (
          <span
            key={s}
            style={{
              fontSize: 14,
              padding: '6px 12px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.16)',
            }}
          >
            {s}
          </span>
        ))}
      </div>
    ) : null;

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--black)', color: 'var(--white)' }}>
      <div className="container" style={{ maxWidth: 760, paddingTop: 48, paddingBottom: 72, display: 'grid', gap: 36 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" className="display" style={{ fontSize: 18, color: 'var(--white)' }}>
            ReelWorx NextMission
          </Link>
          <Link
            href={`/p/${id}/resume`}
            style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', textDecoration: 'underline' }}
          >
            Clean résumé version →
          </Link>
        </div>

        <header style={{ display: 'grid', gap: 16 }}>
          {profile.introPosterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.introPosterUrl}
              alt="Intro video"
              style={{ width: '100%', borderRadius: 20, aspectRatio: '16 / 9', objectFit: 'cover', background: '#111' }}
            />
          ) : null}
          <h1 className="display spectrum-text" style={{ fontSize: 'clamp(34px, 6vw, 60px)', margin: 0, textTransform: 'none' }}>
            {profile.headline ?? profile.handle}
          </h1>
          <p className="muted" style={{ margin: 0, fontSize: 15, color: 'rgba(255,255,255,0.6)' }}>
            {[profile.hometown && `Roots: ${profile.hometown}`, profile.currentLocation].filter(Boolean).join(' · ') ||
              'A story-first profile'}
          </p>
          {profile.introStreamUrl ? (
            <a href={profile.introStreamUrl} style={{ fontSize: 14, fontWeight: 600, color: 'var(--spectrum-blue)' }}>
              ▶ Watch the intro
            </a>
          ) : null}
        </header>

        {profile.decoded ? (
          <Section title="The story, decoded">
            <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6 }}>{profile.decoded.businessSummary}</p>
            {profile.decoded.proofSignals.length ? <div style={{ marginTop: 14 }}>{chips(profile.decoded.proofSignals)}</div> : null}
          </Section>
        ) : null}

        {profile.skills.length || profile.civilianEquivalents.length ? (
          <Section title="What they bring">{chips([...profile.skills, ...profile.civilianEquivalents])}</Section>
        ) : null}

        {profile.whyEachMove.length ? (
          <Section title="The why behind the moves">
            <div style={{ display: 'grid', gap: 16 }}>
              {profile.whyEachMove.map((w, i) => (
                <div key={i}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{w.role}</div>
                  <p style={{ margin: '4px 0 0', fontSize: 15, lineHeight: 1.55, color: 'rgba(255,255,255,0.8)' }}>{w.why}</p>
                </div>
              ))}
            </div>
          </Section>
        ) : null}

        {profile.values.length ? <Section title="What drives them">{chips(profile.values)}</Section> : null}

        {profile.exploringPaths.length ? (
          <Section title="Where they’re headed">{chips(profile.exploringPaths)}</Section>
        ) : null}

        <div className="spectrum-bar" style={{ maxWidth: 120 }} />
        <p className="muted" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
          Built on ReelWorx NextMission — story, science, and signal.
        </p>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ display: 'grid', gap: 12 }}>
      <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>
        {title}
      </h2>
      {children}
    </section>
  );
}
