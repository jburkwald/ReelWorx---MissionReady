import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Marcus's candidate experience, on the web — a mobile-shaped, guest-friendly journey
// that shares the same backend (packages/shared) as the native app. Public: no Clerk,
// no sign-in needed to explore. Centered "app column" so it feels like a phone.
export const metadata: Metadata = {
  title: 'ReelWorx NextMission — your next mission',
  description:
    'Made for the ones who served. Build a profile that shows who you became, discover paths you never pictured, and get seen — no resume.',
};

export default function StartLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--gray-050)',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          minHeight: '100dvh',
          background: 'var(--white)',
          boxShadow: '0 0 80px rgba(0,0,0,0.07)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>
    </div>
  );
}
