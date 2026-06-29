import type { ReactNode } from 'react';
import Link from 'next/link';
import { ClerkProvider } from '@clerk/nextjs';
import { clerkEnabled } from '../../lib/clerk';

// Sign-in / sign-up render Clerk's <SignIn>/<SignUp> components, so they need
// ClerkProvider. It's scoped here (not the root layout) so public pages stay Clerk-free.
// In keyless demo mode there are no accounts, so we show a friendly notice instead of
// mounting Clerk (which can't initialize without a key in production).
export default function AuthLayout({ children }: { children: ReactNode }) {
  if (!clerkEnabled) {
    return (
      <main
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 32,
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Sign-in is off in this preview</h1>
        <p style={{ fontSize: 16, color: 'var(--gray-700)', maxWidth: 460, margin: 0 }}>
          This is a no-account demo. Explore both sides directly, with sample data.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/start" className="btn btn-spectrum">
            Veteran experience
          </Link>
          <Link href="/dashboard" className="btn btn-ghost">
            Company dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#0a0a0a',
          borderRadius: '14px',
          fontFamily: 'var(--font-body)',
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
