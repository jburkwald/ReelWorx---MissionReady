'use client';

import Link from 'next/link';
import { useState } from 'react';
import { LIVING_CHAPTER_PROMPTS, type LivingChapter } from '@reelworx/shared';

// The Living Profile (Feature 1.6): your story keeps growing. Keyless demo seeds two
// chapters and lets you add one locally so the experience is walkable; the mobile app
// persists chapters via /api/chapters.
const DEMO_CHAPTERS: LivingChapter[] = [
  {
    id: 'demo-chapter-2',
    title: 'First process win',
    body: 'Rebuilt the morning staging routine and cut the start-of-shift scramble. Felt like the old days, in the best way.',
    at: '2026-06-10T15:00:00.000Z',
  },
  {
    id: 'demo-chapter-1',
    title: 'Started at Ridgeline',
    body: 'Six weeks in as a shift lead. The team is sharp, and the calm-under-pressure thing translates straight over.',
    at: '2026-05-02T15:00:00.000Z',
  },
];

function when(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

export default function LivingProfile() {
  const [chapters, setChapters] = useState<LivingChapter[]>(DEMO_CHAPTERS);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [celebrate, setCelebrate] = useState(false);

  const prompt = LIVING_CHAPTER_PROMPTS[chapters.length % LIVING_CHAPTER_PROMPTS.length];

  function add() {
    if (!title.trim() && !body.trim()) return;
    setChapters((c) => [
      { id: `local-${Date.now()}`, title: title.trim() || 'New chapter', body: body.trim(), at: new Date().toISOString() },
      ...c,
    ]);
    setTitle('');
    setBody('');
    setCelebrate(true);
    window.setTimeout(() => setCelebrate(false), 2200);
  }

  return (
    <main style={{ flex: 1, padding: '22px 20px 40px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/start" style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-700)' }}>
          ‹ Back
        </Link>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.4, color: 'var(--gray-400)' }}>
          LIVING PROFILE
        </span>
      </div>

      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.4, margin: 0 }}>
          Your story keeps growing.
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--gray-700)', marginTop: 8 }}>
          Not frozen at sign-up. Add a chapter whenever something changes, and your profile
          becomes a career narrative, not a snapshot.
        </p>
      </div>

      <div style={{ border: '1px solid var(--gray-100)', borderRadius: 'var(--radius-lg)', background: 'var(--white)', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: 0.3, color: 'var(--gray-400)', textTransform: 'uppercase' }}>
          Add a chapter
        </span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give it a title"
          style={{ width: '100%', height: 44, borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-100)', background: 'var(--gray-050)', padding: '0 14px', fontSize: 15, fontFamily: 'var(--font-body)' }}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={prompt}
          rows={3}
          style={{ width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-100)', background: 'var(--gray-050)', padding: 12, fontSize: 14.5, fontFamily: 'var(--font-body)', resize: 'vertical' }}
        />
        <button onClick={add} disabled={!title.trim() && !body.trim()} className="btn btn-spectrum" style={{ height: 46, opacity: !title.trim() && !body.trim() ? 0.45 : 1 }}>
          Add this chapter
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {chapters.map((c) => (
          <div key={c.id} className="rise-in" style={{ borderLeft: '3px solid var(--brand-red)', paddingLeft: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>{c.title}</h2>
              <span style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 600, whiteSpace: 'nowrap' }}>{when(c.at)}</span>
            </div>
            {c.body ? <p style={{ margin: '6px 0 0', fontSize: 14.5, lineHeight: 1.55, color: 'var(--gray-700)' }}>{c.body}</p> : null}
          </div>
        ))}
      </div>

      {celebrate ? (
        <div className="celebrate" onClick={() => setCelebrate(false)}>
          <div className="big">
            <div>Another</div>
            <div>chapter</div>
          </div>
          <p style={{ fontSize: 17, fontWeight: 600, maxWidth: 280, margin: 0, opacity: 0.95 }}>
            Your story is alive. Keep it coming.
          </p>
        </div>
      ) : null}
    </main>
  );
}
