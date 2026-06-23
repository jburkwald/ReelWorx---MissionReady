import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { BRAND } from '@reelworx/shared';

export const dynamic = 'force-dynamic';

export default function SignInPage() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 28,
        padding: 24,
      }}
    >
      <Link href="/" className="display" style={{ fontSize: 24 }}>
        {BRAND.product}
      </Link>
      <SignIn forceRedirectUrl="/dashboard" signUpUrl="/sign-up" />
    </main>
  );
}
