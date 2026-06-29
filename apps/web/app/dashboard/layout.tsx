import type { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { clerkEnabled } from '../../lib/clerk';

// The company dashboard is the Clerk surface (UserButton, session). ClerkProvider lives
// here, not in the root layout, so public pages never depend on Clerk loading. In keyless
// demo mode (no Clerk key) we skip ClerkProvider entirely — it can't initialize without a
// key in production.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  if (!clerkEnabled) return <>{children}</>;
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
