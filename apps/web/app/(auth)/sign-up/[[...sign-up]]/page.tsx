import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';
import { BRAND } from '@reelworx/shared';

export const dynamic = 'force-dynamic';

export default function SignUpPage() {
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
      <div style={{ textAlign: 'center' }}>
        <Link href="/" className="display" style={{ fontSize: 24 }}>
          {BRAND.product}
        </Link>
        <p className="muted" style={{ margin: '6px 0 0', fontSize: 14 }}>
          Create your company account and plant your flag.
        </p>
      </div>
      <SignUp forceRedirectUrl="/dashboard" signInUrl="/sign-in" />
    </main>
  );
}
