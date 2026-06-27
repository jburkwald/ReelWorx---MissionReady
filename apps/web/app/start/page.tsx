import Link from 'next/link';

export const dynamic = 'force-dynamic';

// Marcus's front door. The behavioral goal is the lowest possible activation energy:
// one warm, familiar action (talk — a behavior he already has), not a task list. The
// reassurances answer the three anxieties before they're felt — time, control,
// exposure — so starting costs almost nothing.
const REASSURANCES = ['About 5 minutes', 'Stop anytime', 'Nothing’s public until you say so'];

export default function CandidateHome() {
  return (
    <main
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '26px 24px 28px',
      }}
    >
      <div className="fade-in-up" style={{ animationDelay: '0ms' }}>
        <span className="display" style={{ fontSize: 17, letterSpacing: 1 }}>
          REELWORX NEXTMISSION
        </span>
        <div className="spectrum-bar" style={{ width: 52, height: 4, marginTop: 8 }} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 22, paddingTop: 24, paddingBottom: 24 }}>
        <p
          className="fade-in-up muted"
          style={{ animationDelay: '60ms', margin: 0, fontSize: 12.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}
        >
          Made for the ones who served
        </p>

        <h1
          className="fade-in-up"
          style={{ animationDelay: '120ms', fontSize: 38, lineHeight: 1.05, fontWeight: 800, letterSpacing: -0.8, margin: 0 }}
        >
          Let’s start with
          <br />
          your story.
        </h1>

        <p
          className="fade-in-up"
          style={{ animationDelay: '180ms', fontSize: 17, lineHeight: 1.55, color: 'var(--gray-700)', margin: 0 }}
        >
          No forms. No resume. Just talk it through, the way you’d tell it to someone
          who gets it. I’ll take care of the rest.
        </p>

        <div className="fade-in-up" style={{ animationDelay: '240ms', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Link
            href="/start/story"
            className="btn btn-spectrum"
            style={{ height: 56, fontSize: 17, fontWeight: 700, width: '100%' }}
          >
            Start the conversation
          </Link>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {REASSURANCES.map((r) => (
              <span
                key={r}
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: 'var(--gray-700)',
                  background: 'var(--gray-050)',
                  border: '1px solid var(--gray-100)',
                  borderRadius: 'var(--radius-full)',
                  padding: '6px 12px',
                }}
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="fade-in-up" style={{ animationDelay: '320ms', borderTop: '1px solid var(--gray-100)', paddingTop: 18 }}>
        <p className="muted" style={{ margin: '0 0 10px', fontSize: 13 }}>
          Not ready to talk? Wander first — no account needed.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Link href="/start/paths" style={{ fontSize: 15, fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
            <span>See paths that might fit you</span>
            <span className="muted">›</span>
          </Link>
          <Link href="/start/fit" style={{ fontSize: 15, fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
            <span>See companies that fit you</span>
            <span className="muted">›</span>
          </Link>
          <Link href="/start/strength" style={{ fontSize: 15, fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
            <span>See how profile strength works</span>
            <span className="muted">›</span>
          </Link>
          <Link href="/jobs" style={{ fontSize: 15, fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
            <span>Browse open roles</span>
            <span className="muted">›</span>
          </Link>
        </div>
        <Link
          href="/"
          className="muted"
          style={{ display: 'block', marginTop: 16, fontSize: 12, textAlign: 'center', textDecoration: 'underline' }}
        >
          I’m a company →
        </Link>
      </div>
    </main>
  );
}
