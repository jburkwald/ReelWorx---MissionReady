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

// The Story Profile agent — Marcus's centerpiece. Calm, one question at a time; the
// strength meter climbs as the story takes shape. Guest mode (no sign-in, no DB).
export default function GuestStory() {
  const scroller = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<StoryMessage[]>([
    { role: 'assistant', content: STORY_OPENER },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [strength, setStrength] = useState(6);

  // Accumulated extraction → real profile-strength via the shared, honest formula.
  const acc = useRef({ skills: new Set<string>(), values: new Set<string>(), headline: '', why: 0 });

  function scrollDown() {
    requestAnimationFrame(() => {
      scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
    });
  }

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    const next: StoryMessage[] = [...messages, { role: 'user', content: text }];
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
        setStrength(
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
        // Preview without an AI key — let the meter climb so the experience is felt.
        setStrength((s) => Math.min(72, s + 12));
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
      {/* Header + strength */}
      <header style={{ padding: '18px 20px 12px', borderBottom: '1px solid var(--gray-100)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/start" style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-700)' }}>
            ‹ Back
          </Link>
          <span style={{ fontSize: 13, fontWeight: 800 }}>Profile strength {strength}%</span>
        </div>
        <div style={{ marginTop: 10, height: 8, borderRadius: 999, background: 'var(--gray-100)', overflow: 'hidden' }}>
          <div style={{ width: `${strength}%`, height: '100%', background: 'var(--spectrum)', transition: 'width .5s cubic-bezier(0.22,1,0.36,1)' }} />
        </div>
        <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--gray-400)' }}>
          Take your time. You can stop anytime — we save your place.
        </p>
      </header>

      {/* Messages */}
      <div ref={scroller} style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '86%',
              background: m.role === 'user' ? 'var(--black)' : 'var(--gray-050)',
              color: m.role === 'user' ? '#fff' : 'var(--gray-900)',
              border: m.role === 'user' ? 'none' : '1px solid var(--gray-100)',
              borderRadius: 18,
              padding: '11px 15px',
              fontSize: 15.5,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
            }}
          >
            {m.content}
          </div>
        ))}
        {sending ? (
          <div style={{ alignSelf: 'flex-start', color: 'var(--gray-400)', fontSize: 14, padding: '4px 6px' }}>…</div>
        ) : null}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 16px 20px', borderTop: '1px solid var(--gray-100)' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
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
          onClick={send}
          disabled={!input.trim() || sending}
          className="btn btn-spectrum"
          style={{ height: 46, opacity: !input.trim() || sending ? 0.4 : 1 }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
