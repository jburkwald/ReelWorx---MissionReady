import type { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';

// The company dashboard is the Clerk surface (UserButton, session). ClerkProvider lives
// here, not in the root layout, so public pages never depend on Clerk loading.
export default function DashboardLayout({ children }: { children: ReactNode }) {
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
