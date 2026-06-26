import type { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';

// Sign-in / sign-up render Clerk's <SignIn>/<SignUp> components, so they need
// ClerkProvider. It's scoped here (not the root layout) so public pages stay Clerk-free.
export default function AuthLayout({ children }: { children: ReactNode }) {
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
