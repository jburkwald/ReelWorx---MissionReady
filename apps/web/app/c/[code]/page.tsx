import Link from 'next/link';
import { getChampionLanding, prisma } from '@reelworx/shared/server';
import { captureLeadAction } from './actions';

export const dynamic = 'force-dynamic';

// Public landing a member reaches by scanning their counselor's QR / tapping the link
// (Feature 8.1). Warm and effortless — opt in with one field, before any account exists.
export default async function ChampionLanding({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const { code } = await params;
  const { done } = await searchParams;

  let office: string | null = null;
  let known = true;
  try {
    const landing = await getChampionLanding(prisma, code);
    if (!landing) known = false;
    else office = landing.office;
  } catch {
    known = false;
  }

  const capture = captureLeadAction.bind(null, code);

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--black)', color: 'var(--white)' }}>
      <div
        className="container"
        style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24, paddingTop: 48, paddingBottom: 48, maxWidth: 640 }}
      >
        <div className="spectrum-bar" style={{ maxWidth: 80 }} />

        {done ? (
          <>
            <h1 className="display spectrum-text" style={{ fontSize: 'clamp(36px, 7vw, 60px)', margin: 0 }}>
              You’re in. We’ve got you.
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)' }}>
              Watch for a note from us with your next step. Your story starts here — and
              you’ll never have to flatten it into a résumé again.
            </p>
            <div>
              <Link href="/sign-up" className="btn btn-spectrum">Create your profile now</Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="display" style={{ fontSize: 'clamp(36px, 7vw, 60px)', margin: 0, textTransform: 'uppercase' }}>
              Welcome{office ? ` from ${office}` : ''}.
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)' }}>
              {known
                ? 'You’re about to build a profile that shows who you became in service — and find where you go next. Drop your email or number and we’ll guide you in.'
                : 'This invite link isn’t active, but you can still join — drop your email or number and we’ll guide you in.'}
            </p>
            <form action={capture} style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
              <input name="email" type="email" placeholder="Email" style={fieldStyle} />
              <input name="phone" type="tel" placeholder="Or phone number" style={fieldStyle} />
              <button type="submit" className="btn btn-spectrum">Guide me in</button>
            </form>
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
