import Link from 'next/link';
import {
  STRENGTH_TIERS,
  computeProfileStrength,
  type ComponentStatus,
} from '@reelworx/shared';

export const dynamic = 'force-dynamic';

// The Veteran's Own View of strength (Feature 6.2), web stand-in. Renders the component
// registry honestly: what's done, what's a boost, and the reserved hiring-manager review
// as a locked slot that is NOT the candidate's gap to close. Demo shows Marcus at Standout.
export default function StrengthView() {
  const strength = computeProfileStrength({
    foundationComplete: true,
    videoStatus: 'ready',
    assessmentComplete: true,
  });

  return (
    <main style={{ flex: 1, padding: '22px 22px 36px', display: 'flex', flexDirection: 'column', gap: 22 }}>
      <Link href="/start" style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-700)' }}>
        ‹ Back
      </Link>

      <div>
        <p style={{ margin: 0, fontSize: 12.5, fontWeight: 800, letterSpacing: 0.4, color: 'var(--gray-400)', textTransform: 'uppercase' }}>
          Your profile strength
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 6 }}>
          <span className="display spectrum-text" style={{ fontSize: 64, lineHeight: 0.9 }}>
            {strength.score}
          </span>
          <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--gray-400)', marginBottom: 8 }}>
            / {strength.maxScore}
          </span>
        </div>
        <p style={{ margin: '6px 0 0', fontSize: 16, fontWeight: 800 }}>{strength.tier.label}</p>
        <p style={{ margin: '2px 0 0', fontSize: 14, color: 'var(--gray-700)' }}>{strength.tier.blurb}</p>
        <div className="meter-track" style={{ marginTop: 14, height: 10 }}>
          <div className="meter-fill" style={{ width: `${strength.score}%` }} />
        </div>
      </div>

      {/* Components — the registry, in the open. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, letterSpacing: 0.3, color: 'var(--gray-400)', textTransform: 'uppercase' }}>
          What builds your strength
        </p>
        {strength.components.map((c) => (
          <div
            key={c.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              border: '1px solid var(--gray-100)',
              borderRadius: 'var(--radius-md)',
              background: c.status === 'locked' ? 'var(--gray-050)' : 'var(--white)',
              padding: '12px 14px',
              opacity: c.status === 'locked' ? 0.72 : 1,
            }}
          >
            <StatusDot status={c.status} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{c.label}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: c.status === 'complete' ? 'var(--brand-red)' : 'var(--gray-400)' }}>
                  {c.status === 'locked' ? 'soon' : `+${c.weight}`}
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--gray-700)', lineHeight: 1.45 }}>
                {c.status === 'locked'
                  ? 'Reserved for later. This is not your gap to close — your strength caps at 90 until it ships.'
                  : c.blurb}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Tier ladder. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, letterSpacing: 0.3, color: 'var(--gray-400)', textTransform: 'uppercase' }}>
          The ladder
        </p>
        {[...STRENGTH_TIERS]
          .slice()
          .reverse()
          .map((t) => {
            const here = strength.tier.key === t.key;
            return (
              <div
                key={t.key}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: here ? '1px solid var(--brand-red)' : '1px solid var(--gray-100)',
                  background: here ? 'rgba(228,0,43,0.05)' : 'transparent',
                }}
              >
                <span style={{ fontSize: 14, fontWeight: here ? 800 : 600 }}>
                  {t.label}
                  {here ? ' · you’re here' : ''}
                </span>
                <span style={{ fontSize: 13, color: 'var(--gray-400)', fontWeight: 700 }}>{t.min}+</span>
              </div>
            );
          })}
      </div>

      <p style={{ fontSize: 12.5, color: 'var(--gray-400)', lineHeight: 1.5 }}>
        Strength is what you’ve completed, not how much you typed. Longer answers never change
        it. Each component lands its full weight the moment it’s done.
      </p>
    </main>
  );
}

function StatusDot({ status }: { status: ComponentStatus }) {
  const map: Record<ComponentStatus, { bg: string; mark: string; color: string }> = {
    complete: { bg: 'var(--brand-red)', mark: '✓', color: '#fff' },
    processing: { bg: 'var(--gray-400)', mark: '…', color: '#fff' },
    incomplete: { bg: 'var(--gray-100)', mark: '', color: 'var(--gray-400)' },
    locked: { bg: 'var(--gray-100)', mark: '🔒', color: 'var(--gray-400)' },
  };
  const s = map[status];
  return (
    <span
      style={{
        width: 26,
        height: 26,
        borderRadius: 999,
        background: s.bg,
        color: s.color,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        fontWeight: 800,
        flexShrink: 0,
      }}
    >
      {s.mark}
    </span>
  );
}
