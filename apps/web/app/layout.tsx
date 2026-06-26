import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Bebas_Neue, DM_Sans } from 'next/font/google';
import { BRAND } from '@reelworx/shared';
import './globals.css';

// Locked ReelWorx type pairing, loaded from Google Fonts (no licensed Apple fonts).
const display = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});
const body = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: BRAND.product,
  description:
    'Hire the ones who served. Meet people through story and a science-backed fit read, not resumes and keyword search.',
};

// ClerkProvider is intentionally NOT here. Public pages (home, /jobs, /p, /c, /join,
// /share) must render WITHOUT Clerk so browsing never depends on Clerk loading.
// ClerkProvider is added only in the surfaces that use Clerk components: the dashboard
// (app/dashboard/layout.tsx) and the auth pages (app/(auth)/layout.tsx).
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
