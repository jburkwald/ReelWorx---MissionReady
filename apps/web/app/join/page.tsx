import Link from 'next/link';
import { buildDigest, prisma, type DigestItem } from '@reelworx/shared/server';
import { joinAction } from './actions';

export const dynamic = 'force-dynamic';

// Owned Capture & Digest (Feature 8.2) — the member opt-in at the transition point. Public,
// no account needed. A live preview of the digest shows the value before they commit; the
// weekly send itself is the one deferred piece (needs an email/SMS provider).
export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string }>;
}) {
  const { done } = await searchParams;

  let digest: DigestItem[] = [];
  try {
    digest = await buildDigest(prisma, { limit: 5 });
  } catch {
    /* no DB yet — the opt-in still works conceptually */
  }

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--black)', color: 'var(--white)' }}>
      <div className="container" style={{ paddingTop: 56, paddingBottom: 64, maxWidth: 720, display: 'grid', gap: 28 }}>
        <Link href="/" className="display" style={{ fontSize: 22, color: 'var(--white)' }}>
          ReelWorx NextMission
        </Link>
        <div className="spectrum-bar" style={{ maxWidth: 80 }} />

        {done ? (
          <>
            <h1 className="display spectrum-text" style={{ fontSize: 'clamp(40px, 8vw, 72px)', margin: 0 }}>
              You’re in.
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)' }}>
              We’ll send a steady, relevant drumbeat of opportunities — never spam. When
              you’re ready, build your profile and we’ll prioritize your hometown.
            </p>
            <div>
              <Link href="/sign-up" className="btn btn-spectrum">Build my profile</Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="display" style={{ fontSize: 'clamp(40px, 8vw, 72px)', margin: 0, textTransform: 'uppercase' }}>
              Leaving the service?
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)' }}>
              Get a steady drumbeat of real opportunities — especially close to home — the
              moment they appear. Drop your email or number. No spam, ever.
            </p>
            <form action={joinAction} style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
              <input name="email" type="email" placeholder="Email" style={fieldStyle} />
              <input name="phone" type="tel" placeholder="Or phone number" style={fieldStyle} />
              <button type="submit" className="btn btn-spectrum">Keep me in the loop</button>
            </form>

            {digest.length > 0 ? (
              <div style={{ marginTop: 12 }}>
                <p className="muted" style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>
                  A taste of this week
                </p>
                <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
                  {digest.map((d, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: 10 }}>
                      <span style={{ fontSize: 15, fontWeight: 600 }}>{d.roleTitle}</span>
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
                        {d.organizationName}{d.location ? ` · ${d.location}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}

const fieldStyle = {
  height: 50,
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(255,255,255,0.06)',
  color: 'var(--white)',
  padding: '0 16px',
  fontSize: 16,
} as const;
