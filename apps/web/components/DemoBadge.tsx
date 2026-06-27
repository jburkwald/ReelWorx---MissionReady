import type { CSSProperties } from 'react';
import { isDbConfigured } from '@reelworx/shared/server';

// A small, honest "you're exploring sample data" pill. Renders only in keyless demo mode
// (no DATABASE_URL); once a real backend is configured it disappears entirely.
export function DemoBadge({ style }: { style?: CSSProperties }) {
  if (isDbConfigured()) return null;
  return (
    <span
      title="No database configured — every screen is walkable with sample data. Add DATABASE_URL + Clerk keys to run the real backend."
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: 'var(--gray-700)',
        background: 'var(--gray-050)',
        border: '1px solid var(--gray-100)',
        borderRadius: 'var(--radius-full)',
        padding: '5px 12px',
        ...style,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: 999,
          background: 'var(--brand-red)',
          display: 'inline-block',
        }}
      />
      Demo mode · sample data
    </span>
  );
}
