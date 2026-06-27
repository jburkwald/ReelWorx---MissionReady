'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import {
  computeProfileCompleteness,
  STORY_OPENER,
  type ProfileExtraction,
  type StoryMessage,
} from '@reelworx/shared';

interface GuestStoryResponse {
  reply: string;
  extraction?: ProfileExtraction;
  demo?: boolean;
}

// Tap-to-answer starters — the single highest-friction moment is the first reply, so we
// remove the blank page. "I'm not sure" matters most: it meets the person who doesn't
// yet know who they become next (Marcus) without judgment.
const OPENER_CHIPS = ['Where I served', 'What I’m hoping for next', 'I’m not sure where to start'];

// Variable, earned celebration — only at real milestones, never decorative.
const MILESTONES = [
  { at: 30, big: 'Taking\nshape', sub: 'Companies can start to see who you are.' },
  { at: 60, big: 'Look\nat you', sub: 'Your story is getting strong.' },
  { at: 90, big: 'So\nclose', sub: 'This is a profile to be proud of.' },
];

export default function GuestStory() {
  const scroller = useRef<HTMLDivElement>(null);
  const acc = useRef({ skills: new Set<string>(), values: new Set<string>(), headline: '', why: 0 });

  const [messages, setMessages] = useState<StoryMessage[]>([
    { role: 'assistant', content: STORY_OPENER },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [strength, setStrength] = useState(6);
  const [celebration, setCelebration] = useState<{ big: string; sub: string } | null>(null);

  const showOpenerChips = messages.length === 1 && !sending;

  function scrollDown() {
    requestAnimationFrame(() =>
      scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' }),
    );
  }

  function bumpStrength(next: number) {
    const crossed = MILESTONES.filter((m) => strength < m.at && next >= m.at).pop();
    setStrength(next);
    if (crossed) {
      setCelebration({ big: crossed.big, sub: crossed.sub });
      window.setTimeout(() => setCelebration(null), 2600);
    }
  }

  async function sendText(text: string) {
    const clean = text.trim();
    if (!clean || sending) return;
    const next: StoryMessage[] = [...messages, { role: 'user', content: clean }];
    setMessages(next);
    setInput('');
    setSending(true);
    scrollDown();

    try {
      const res = await fetch('/api/guest/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });
      const data: GuestStoryResponse = await res.json();
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }]);

      if (data.extraction) {
        const a = acc.current;
        data.extraction.skills?.forEach((s) => a.skills.add(s));
        data.extraction.coreValues?.forEach((v) => a.values.add(v));
        if (data.extraction.headline) a.headline = data.extraction.headline;
        a.why += data.extraction.whyEachMove?.length ?? 0;
        bumpStrength(
          computeProfileCompleteness({
            hasIntroVideo: false,
            headline: a.headline,
            skillsCount: a.skills.size,
            valuesCount: a.values.size,
            whyEachMoveCount: a.why,
            hasFitProfile: a.skills.size > 0 || a.values.size > 0,
            hasAssessment: false,
            chaptersCount: 0,
          }),
        );
      } else if (data.demo) {
        bumpStrength(Math.min(72, strength + 12));
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: 'I’m having trouble reaching the guide — your place is saved. Try again in a moment.' },
      ]);
    } finally {
      setSending(false);
      scrollDown();
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <header style={{ padding: '18px 20px 12px', borderBottom: '1px solid var(--gray-100)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/start" style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-700)' }}>
            ‹ Back
          </Link>
          <span style={{ fontSize: 13, fontWeight: 800 }}>Profile strength {strength}%</span>
        </div>
        <div className="meter-track" style={{ marginTop: 10, height: 8 }}>
          <div className="meter-fill" style={{ width: `${strength}%` }} />
        </div>
        <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--gray-400)' }}>
          Take your time. You can stop anytime — we save your place.
        </p>
      </header>

      <div ref={scroller} style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m, i) => (
          <div
            key={i}
            className={i === messages.length - 1 ? 'rise-in' : undefined}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '88%',
              background: m.role === 'user' ? 'var(--black)' : 'var(--gray-050)',
              color: m.role === 'user' ? '#fff' : 'var(--gray-900)',
              border: m.role === 'user' ? 'none' : '1px solid var(--gray-100)',
              borderRadius: 20,
              padding: '12px 16px',
              fontSize: 15.5,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
            }}
          >
            {m.content}
          </div>
        ))}
        {sending ? (
          <div className="typing" style={{ alignSelf: 'flex-start', background: 'var(--gray-050)', border: '1px solid var(--gray-100)', borderRadius: 20 }}>
            <i /><i /><i />
          </div>
        ) : null}
      </div>

      {/* Tap-to-answer starters (lowest friction) */}
      {showOpenerChips ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0 16px 4px' }}>
          {OPENER_CHIPS.map((c) => (
            <button key={c} className="chip" onClick={() => sendText(c)}>
              {c}
            </button>
          ))}
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 8, padding: '12px 16px 20px', borderTop: '1px solid var(--gray-100)' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendText(input);
            }
          }}
          placeholder="Type your answer…"
          style={{
            flex: 1,
            height: 46,
            borderRadius: 999,
            border: '1px solid var(--gray-100)',
            background: 'var(--gray-050)',
            padding: '0 16px',
            fontSize: 15.5,
            fontFamily: 'var(--font-body)',
          }}
        />
        <button
          onClick={() => sendText(input)}
          disabled={!input.trim() || sending}
          className="btn btn-spectrum"
          style={{ height: 46, opacity: !input.trim() || sending ? 0.4 : 1 }}
        >
          Send
        </button>
      </div>

      {celebration ? (
        <div className="celebrate" onClick={() => setCelebration(null)}>
          <div className="big">
            {celebration.big.split('\n').map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
          <p style={{ fontSize: 17, fontWeight: 600, maxWidth: 280, margin: 0, opacity: 0.95 }}>
            {celebration.sub}
          </p>
        </div>
      ) : null}
    </div>
  );
}
