import type { CSSProperties } from 'react';
import Link from 'next/link';
import { createRoleAction } from '../actions';

export const dynamic = 'force-dynamic';

const input: CSSProperties = {
  width: '100%',
  borderRadius: 14,
  border: '1px solid var(--gray-100)',
  background: 'var(--white)',
  padding: '12px 14px',
  fontSize: 15,
  fontFamily: 'var(--font-body)',
  marginTop: 6,
};

export default function NewRolePage() {
  return (
    <main style={{ minHeight: '100dvh', background: 'var(--gray-050)' }}>
      <header style={{ background: 'var(--white)', borderBottom: '1px solid var(--gray-100)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: 64 }}>
          <Link href="/dashboard/roles" className="display" style={{ fontSize: 22 }}>
            ‹ Roles
          </Link>
        </div>
        <div className="spectrum-bar" style={{ borderRadius: 0 }} />
      </header>

      <section className="container" style={{ paddingTop: 40, paddingBottom: 64 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Create a role</h1>
        <p className="muted" style={{ marginTop: 6, maxWidth: 560 }}>
          Lead with a short video of the real work — a realistic preview reduces bad-fit
          churn far more than a bullet list. We&apos;ll read the human profile this role
          needs from your description.
        </p>

        <form action={createRoleAction} className="card" style={{ marginTop: 24, maxWidth: 640 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600 }}>
            Job story video URL <span className="muted" style={{ fontWeight: 400 }}>(recommended — video-first)</span>
            <input name="videoUrl" type="url" placeholder="https://… (a short look at the real work)" style={input} />
          </label>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginTop: 18 }}>
            Title
            <input name="title" required placeholder="e.g. Regional Operations Lead" style={input} />
          </label>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginTop: 18 }}>
            Location <span className="muted" style={{ fontWeight: 400 }}>(optional)</span>
            <input name="location" placeholder="e.g. Columbus, OH (or remote)" style={input} />
          </label>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginTop: 18 }}>
            What the role really involves
            <textarea
              name="description"
              required
              rows={6}
              placeholder="Describe the work, the team, what success looks like, and the kind of person who thrives here."
              style={{ ...input, resize: 'vertical' }}
            />
          </label>
          <button type="submit" className="btn btn-spectrum" style={{ marginTop: 20 }}>
            Create role &amp; read its profile
          </button>
        </form>
      </section>
    </main>
  );
}
