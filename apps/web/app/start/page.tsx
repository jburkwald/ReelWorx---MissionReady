import Link from 'next/link';

export const dynamic = 'force-dynamic';

// Marcus's home. Warm, calm, anxious-friendly. The journey laid out as small steps —
// visible progress, never a wall. Black/white/red with red→blue (flag) energy.
const STEPS: {
  n: number;
  title: string;
  blurb: string;
  href?: string;
  soon?: boolean;
}[] = [
  {
    n: 1,
    title: 'Tell your story',
    blurb: 'Talk it through with a guide, one step at a time. No resume.',
    href: '/start/story',
  },
  {
    n: 2,
    title: 'Discover your paths',
    blurb: 'Careers you never pictured — and exactly why each one fits you.',
    href: '/start/paths',
  },
  {
    n: 3,
    title: 'Browse open roles',
    blurb: 'See companies that planted their flag to hire those who served.',
    href: '/jobs',
  },
  {
    n: 4,
    title: 'Record your intro video',
    blurb: '60 seconds: who you are and what you’re excited to do next.',
    soon: true,
  },
  {
    n: 5,
    title: 'Take the Full Spectrum read',
    blurb: 'An honest read on the whole you — and it lifts your profile strength.',
    soon: true,
  },
  {
    n: 6,
    title: 'See who’s interested',
    blurb: 'Who viewed your story, who wants to talk, how you’re growing.',
    soon: true,
  },
];

export default function CandidateHome() {
  const strength = 6;

  return (
    <main style={{ flex: 1, padding: '28px 22px 40px', display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <p className="display" style={{ fontSize: 18, margin: 0, letterSpacing: 1 }}>
          REELWORX NEXTMISSION
        </p>
        <div className="spectrum-bar" style={{ width: 56, height: 4, marginTop: 8 }} />
      </div>

      <div>
        <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.5, margin: 0 }}>
          Let’s build your next mission.
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.5, color: 'var(--gray-700)', marginTop: 10 }}>
          You served. That matters here. We’ll draw out who you became — and show you
          where you could go next. No rush, one step at a time.
        </p>
      </div>

      {/* Profile strength — competence made visible (the calm Wrapped moment) */}
      <div
        style={{
          background: 'var(--gray-050)',
          border: '1px solid var(--gray-100)',
          borderRadius: 'var(--radius-lg)',
          padding: 18,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Profile strength</span>
          <span style={{ fontSize: 14, fontWeight: 800 }}>{strength}%</span>
        </div>
        <div style={{ marginTop: 10, height: 10, borderRadius: 999, background: 'var(--gray-100)', overflow: 'hidden' }}>
          <div style={{ width: `${strength}%`, height: '100%', background: 'var(--spectrum)' }} />
        </div>
        <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--gray-400)' }}>
          Every step you take makes it stronger.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {STEPS.map((s) =>
          s.soon ? (
            <div key={s.n} style={stepStyle(true)}>
              <StepBody {...s} />
            </div>
          ) : (
            <Link key={s.n} href={s.href!} style={{ ...stepStyle(false), textDecoration: 'none' }}>
              <StepBody {...s} />
            </Link>
          ),
        )}
      </div>

      <p style={{ fontSize: 13, color: 'var(--gray-400)', textAlign: 'center', marginTop: 4 }}>
        You can stop anytime — we save your place.
      </p>
      <Link href="/" style={{ fontSize: 12, color: 'var(--gray-400)', textAlign: 'center', textDecoration: 'underline' }}>
        I’m a company →
      </Link>
    </main>
  );
}

function stepStyle(soon: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    background: 'var(--white)',
    border: '1px solid var(--gray-100)',
    borderRadius: 'var(--radius-lg)',
    padding: 16,
    opacity: soon ? 0.55 : 1,
    color: 'var(--gray-900)',
  };
}

function StepBody({ n, title, blurb, soon }: { n: number; title: string; blurb: string; soon?: boolean }) {
  return (
    <>
      <div
        style={{
          flexShrink: 0,
          width: 34,
          height: 34,
          borderRadius: 999,
          background: soon ? 'var(--gray-100)' : 'var(--spectrum)',
          color: soon ? 'var(--gray-400)' : '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: 15,
        }}
      >
        {n}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>{title}</span>
          {soon ? (
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.5, color: 'var(--gray-400)' }}>SOON</span>
          ) : null}
        </div>
        <p style={{ margin: '3px 0 0', fontSize: 13.5, lineHeight: 1.45, color: 'var(--gray-400)' }}>{blurb}</p>
      </div>
      {!soon ? <span style={{ color: 'var(--gray-400)', fontSize: 22 }}>›</span> : null}
    </>
  );
}
