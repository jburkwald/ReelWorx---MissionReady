import Link from 'next/link';

export const dynamic = 'force-dynamic';

// Public landing a shared link forwards to (Feature 4.2). Framed as one veteran pulling the
// next one through — service, not a sales pitch. The click was already logged on the /s hop.
export default async function SharedLanding({
  params,
}: {
  params: Promise<{ short: string }>;
}) {
  await params; // the short code isn't needed to render the welcome; it's already tracked.

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--black)', color: 'var(--white)' }}>
      <div
        className="container"
        style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 28, paddingTop: 48, paddingBottom: 48 }}
      >
        <div className="spectrum-bar" style={{ maxWidth: 80 }} />
        <h1 className="display spectrum-text" style={{ fontSize: 'clamp(40px, 8vw, 72px)', margin: 0 }}>
          Someone who served thinks you should see this.
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.6, maxWidth: 560, color: 'rgba(255,255,255,0.85)' }}>
          ReelWorx NextMission helps people leaving the service get seen for who they
          actually became — through story and a real read on the whole person, not a résumé.
          A fellow service member shared it with you.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/sign-up" className="btn btn-spectrum">Get started</Link>
          <Link href="/" className="btn btn-ghost" style={{ color: 'var(--white)', borderColor: 'rgba(255,255,255,0.3)' }}>
            Learn more
          </Link>
        </div>
      </div>
    </main>
  );
}
