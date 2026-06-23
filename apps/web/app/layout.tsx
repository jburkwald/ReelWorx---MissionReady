import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Bebas_Neue, DM_Sans } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
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
  title: `${BRAND.product} — for companies`,
  description:
    'Hire the ones who served. Meet people through story and a science-backed fit read, not resumes and keyword search.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
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
      <html lang="en" className={`${display.variable} ${body.variable}`}>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
