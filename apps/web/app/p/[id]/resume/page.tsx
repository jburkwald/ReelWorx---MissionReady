import type { ReactNode } from 'react';
import Link from 'next/link';
import { getPublicProfile, prisma, type PublicProfile } from '@reelworx/shared/server';

export const dynamic = 'force-dynamic';

// The clean ATS render (Feature 1.3). Single column, no photo, no media, plain parseable
// text — the version that passes the filters when applied off-platform. Same data as the
// rich story page, deliberately stripped to what an applicant-tracking system can read.
export default async function ResumePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let profile: PublicProfile | null = null;
  try {
    profile = await getPublicProfile(prisma, id);
  } catch {
    /* fall through */
  }

  if (!profile) {
    return (
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '64px 24px' }}>
        <p>This résumé isn’t available.</p>
      </main>
    );
  }

  const allSkills = [...new Set([...profile.skills, ...profile.civilianEquivalents])];

  return (
    <main style={{ background: '#fff', color: '#111', minHeight: '100dvh' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 32px', fontSize: 14, lineHeight: 1.55 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <Link href={`/p/${id}`} style={{ fontSize: 12, color: '#666', textDecoration: 'underline' }}>
            ← Story version
          </Link>
          <span style={{ fontSize: 11, color: '#999' }}>Print to PDF · Ctrl/Cmd-P</span>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 2px' }}>
          {profile.headline ?? profile.handle}
        </h1>
        <p style={{ margin: 0, color: '#444' }}>
          {[profile.currentLocation, profile.hometown && `Hometown: ${profile.hometown}`].filter(Boolean).join(' · ')}
        </p>

        {profile.decoded?.businessSummary ? (
          <ResumeSection title="Summary">
            <p style={{ margin: 0 }}>{profile.decoded.businessSummary}</p>
          </ResumeSection>
        ) : null}

        {allSkills.length ? (
          <ResumeSection title="Skills">
            <p style={{ margin: 0 }}>{allSkills.join(' · ')}</p>
          </ResumeSection>
        ) : null}

        {profile.whyEachMove.length ? (
          <ResumeSection title="Experience">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {profile.whyEachMove.map((w, i) => (
                <li key={i} style={{ marginBottom: 6 }}>
                  <strong>{w.role}.</strong> {w.why}
                </li>
              ))}
            </ul>
          </ResumeSection>
        ) : null}

        {profile.decoded?.proofSignals.length ? (
          <ResumeSection title="Proven">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {profile.decoded.proofSignals.map((s, i) => (
                <li key={i} style={{ marginBottom: 4 }}>{s}</li>
              ))}
            </ul>
          </ResumeSection>
        ) : null}

        {profile.values.length ? (
          <ResumeSection title="Values">
            <p style={{ margin: 0 }}>{profile.values.join(' · ')}</p>
          </ResumeSection>
        ) : null}

        <p style={{ marginTop: 32, fontSize: 11, color: '#aaa' }}>
          Generated from a ReelWorx NextMission profile.
        </p>
      </div>
    </main>
  );
}

function ResumeSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginTop: 22 }}>
      <h2 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#111', borderBottom: '1px solid #ddd', paddingBottom: 4, margin: '0 0 8px' }}>
        {title}
      </h2>
      {children}
    </section>
  );
}
