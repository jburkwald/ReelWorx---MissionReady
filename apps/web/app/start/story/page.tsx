'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import {
  BRAND,
  FOUNDATION_INTRO,
  STORY_OPENER,
  computeProfileStrength,
  foundationCompleteFromSignals,
  getEntryModes,
  getStoryPhase,
  recordPhaseComplete,
  storyPhaseComplete,
  type ParsedResume,
  type ProfileExtraction,
  type StoryEntryMode,
  type StoryMessage,
  type StoryPhaseId,
} from '@reelworx/shared';

interface GuestStoryResponse {
  reply: string;
  extraction?: ProfileExtraction;
  demo?: boolean;
}

const OPENER_CHIPS = ['Where I served', 'What I’m hoping for next', 'I’m not sure where to start'];

// The accumulator of everything the conversation has revealed. Phase completion and
// strength are DERIVED from this, never from how many messages were sent.
interface Acc {
  headline: string;
  skills: Set<string>;
  values: Set<string>;
  why: number;
  whatDrives: boolean;
}

function deriveState(acc: Acc) {
  const signals = {
    headline: acc.headline,
    skillsCount: acc.skills.size,
    whyEachMoveCount: acc.why,
    valuesCount: acc.values.size,
    hasWhatDrives: acc.whatDrives,
  };
  const recordDone = recordPhaseComplete(signals);
  const storyDone = storyPhaseComplete(signals);
  const foundationComplete = foundationCompleteFromSignals(signals);
  const currentPhase: StoryPhaseId = !recordDone ? 'record' : !storyDone ? 'story' : 'boosts';
  const strength = computeProfileStrength({
    foundationComplete,
    videoStatus: 'none',
    assessmentComplete: false,
  });
  // A calm in-phase indicator: a sliver once they've started, full when the phase lands.
  const phaseProgress =
    currentPhase === 'record'
      ? recordDone
        ? 1
        : signals.skillsCount || signals.headline
          ? 0.5
          : 0.15
      : currentPhase === 'story'
        ? storyDone
          ? 1
          : 0.4
        : 1;
  return { recordDone, storyDone, foundationComplete, currentPhase, strength, phaseProgress };
}

export default function GuestStory() {
  const [mode, setMode] = useState<StoryEntryMode | null>(null);

  if (!mode) return <EntryPicker onPick={setMode} />;
  if (mode === 'upload') return <UploadFastTrack onBack={() => setMode(null)} />;
  return <Conversation mode={mode} onBack={() => setMode(null)} />;
}

// ── Step 0: choose your way in ───────────────────────────────────────────────

function EntryPicker({ onPick }: { onPick: (m: StoryEntryMode) => void }) {
  const modes = getEntryModes();
  return (
    <main style={{ flex: 1, padding: '24px 22px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Link href="/start" style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-700)' }}>
        ‹ Back
      </Link>

      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.4, margin: 0 }}>
          Let’s build your profile.
        </h1>
        <p style={{ fontSize: 15.5, lineHeight: 1.55, color: 'var(--gray-700)', marginTop: 10 }}>
          Three short phases. Pick how you want to start. {FOUNDATION_INTRO.estimate}{' '}
          {FOUNDATION_INTRO.reassurance}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => m.available && onPick(m.id)}
            disabled={!m.available}
            style={{
              textAlign: 'left',
              border: '1px solid var(--gray-100)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--white)',
              padding: 18,
              cursor: m.available ? 'pointer' : 'default',
              opacity: m.available ? 1 : 0.55,
              fontFamily: 'var(--font-body)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 18, fontWeight: 800 }}>{m.label}</span>
              <span style={{ fontSize: m.available ? 22 : 11, fontWeight: 700, color: 'var(--gray-400)' }}>
                {m.available ? '›' : 'SOON'}
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--gray-700)' }}>{m.blurb}</p>
          </button>
        ))}
      </div>

      <p style={{ fontSize: 12.5, color: 'var(--gray-400)', marginTop: 'auto' }}>
        However you start, you reach the same foundation. Mode is a preference, not a different
        outcome.
      </p>
    </main>
  );
}

// ── Phase header (shared by every mode) ──────────────────────────────────────

function PhaseHeader({
  currentPhase,
  phaseProgress,
  strengthScore,
  tierLabel,
  onBack,
}: {
  currentPhase: StoryPhaseId;
  phaseProgress: number;
  strengthScore: number;
  tierLabel: string;
  onBack: () => void;
}) {
  const phase = getStoryPhase(currentPhase);
  return (
    <header style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--gray-100)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onBack} style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-700)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          ‹ Back
        </button>
        <span style={{ fontSize: 12.5, fontWeight: 800 }}>
          Strength {strengthScore}%{' '}
          <span style={{ color: 'var(--gray-400)', fontWeight: 700 }}>· {tierLabel}</span>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.3 }}>
          Phase {phase.index} of {phase.total} · {phase.title}
        </span>
        <span style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 600 }}>
          {phase.required ? phase.timeEstimate : 'Optional'}
        </span>
      </div>
      <div className="meter-track" style={{ marginTop: 8, height: 6 }}>
        <div className="meter-fill" style={{ width: `${Math.round(phaseProgress * 100)}%` }} />
      </div>
      <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--gray-400)' }}>{phase.blurb}</p>
    </header>
  );
}

// ── Upload: parse the resume, confirm the record (Phase 1), then converse ─────

const SAMPLE_RESUME =
  'STAFF SERGEANT (E-6), U.S. ARMY — 8 yrs\nLogistics / Supply NCO\n- Led a 45-person section; accountable for $12M of equipment\n- Built the SOPs that cut downtime 30%\n- Promoted ahead of peers\nColumbus, OH';

function UploadFastTrack({ onBack }: { onBack: () => void }) {
  const [text, setText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedResume | null>(null);

  async function parse(useSample: boolean) {
    setParsing(true);
    try {
      const res = await fetch('/api/guest/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: useSample ? '' : text }),
      });
      const data: { parsed: ParsedResume } = await res.json();
      setParsed(data.parsed);
    } catch {
      setParsed(null);
    } finally {
      setParsing(false);
    }
  }

  if (parsed) {
    return (
      <Conversation
        mode="text"
        onBack={onBack}
        seededResume={parsed}
      />
    );
  }

  return (
    <main style={{ flex: 1, padding: '20px 20px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <button onClick={onBack} style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-700)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, alignSelf: 'flex-start' }}>
        ‹ Back
      </button>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Fast-track your record.</h1>
        <p style={{ fontSize: 14.5, lineHeight: 1.55, color: 'var(--gray-700)', marginTop: 8 }}>
          Paste your resume and we’ll pull out your record so you can confirm it. A resume can’t
          show the why, so we’ll talk that part through next.
        </p>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your resume here…"
        rows={8}
        style={{
          width: '100%',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--gray-100)',
          background: 'var(--gray-050)',
          padding: 14,
          fontSize: 14.5,
          fontFamily: 'var(--font-body)',
          resize: 'vertical',
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={() => parse(false)}
          disabled={!text.trim() || parsing}
          className="btn btn-spectrum"
          style={{ height: 50, opacity: !text.trim() || parsing ? 0.45 : 1 }}
        >
          {parsing ? 'Reading your resume…' : 'Pull out my record'}
        </button>
        <button
          onClick={() => {
            setText(SAMPLE_RESUME);
            parse(true);
          }}
          className="btn btn-ghost"
          style={{ height: 46 }}
          disabled={parsing}
        >
          Use a sample resume
        </button>
      </div>
    </main>
  );
}

// ── The phased conversation (text + voice) ───────────────────────────────────

function Conversation({
  mode,
  onBack,
  seededResume,
}: {
  mode: StoryEntryMode;
  onBack: () => void;
  seededResume?: ParsedResume;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const acc = useRef<Acc>({
    headline: seededResume?.headline ?? '',
    skills: new Set(seededResume?.skills ?? []),
    values: new Set<string>(),
    why: 0,
    whatDrives: false,
  });

  const firstAssistant = seededResume
    ? `Got it — that gives me your record: ${seededResume.headline ?? 'your background'}. ` +
      `A resume can’t show the why, though, and that’s the part companies remember. ` +
      `So tell me: what part of that work actually felt right to you?`
    : STORY_OPENER;

  const [messages, setMessages] = useState<StoryMessage[]>([
    { role: 'assistant', content: firstAssistant },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [, force] = useState(0);
  const [celebrated, setCelebrated] = useState(false);
  const [celebration, setCelebration] = useState<{ big: string; sub: string } | null>(null);

  const state = deriveState(acc.current);
  const showOpenerChips = !seededResume && messages.length === 1 && !sending && mode !== 'talk';
  const showVoiceDemo = mode === 'talk' && !sending;

  function scrollDown() {
    requestAnimationFrame(() => scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' }));
  }

  function afterExtraction(extraction: ProfileExtraction | undefined, demo: boolean | undefined) {
    const a = acc.current;
    if (extraction) {
      extraction.skills?.forEach((s) => a.skills.add(s));
      extraction.coreValues?.forEach((v) => a.values.add(v));
      if (extraction.headline) a.headline = extraction.headline;
      a.why += extraction.whyEachMove?.length ?? 0;
      if (extraction.whatDrivesThem) a.whatDrives = true;
    } else if (demo) {
      // Canned demo: nudge the foundation forward so the walk-through reaches Visible.
      const turns = messages.filter((m) => m.role === 'user').length;
      if (!a.headline) a.headline = 'Telling my story';
      if (turns >= 1) a.skills.add('leadership');
      if (turns >= 2) a.whatDrives = true;
    }
    const next = deriveState(a);
    if (!celebrated && next.foundationComplete) {
      setCelebrated(true);
      setCelebration({ big: 'You’re\nvisible', sub: 'Companies can find you now. This is your foundation.' });
      window.setTimeout(() => setCelebration(null), 2800);
    }
    force((n) => n + 1);
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
      afterExtraction(data.extraction, data.demo);
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
      <PhaseHeader
        currentPhase={state.currentPhase}
        phaseProgress={state.phaseProgress}
        strengthScore={state.strength.score}
        tierLabel={state.strength.tier.label}
        onBack={onBack}
      />

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

        {/* Phase 3: foundation done — the optional boosts, framed as strength, not steps. */}
        {state.currentPhase === 'boosts' && !sending ? <BoostsPanel /> : null}
      </div>

      {showOpenerChips ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0 16px 4px' }}>
          {OPENER_CHIPS.map((c) => (
            <button key={c} className="chip" onClick={() => sendText(c)}>
              {c}
            </button>
          ))}
        </div>
      ) : null}

      {showVoiceDemo ? (
        <div style={{ padding: '0 16px 4px' }}>
          <button
            className="chip"
            onClick={() => sendText('I spent eight years in Army logistics, ended up running a 45-person section. The part I liked most was a hard day going smooth because the team was ready.')}
          >
            🎙 Speak your answer (demo)
          </button>
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
          placeholder={mode === 'talk' ? 'Or type your answer…' : 'Type your answer…'}
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
          <Link href="/start/strength" className="btn" style={{ marginTop: 18, background: '#fff', color: 'var(--black)' }}>
            See your profile strength
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function BoostsPanel() {
  return (
    <div
      className="rise-in"
      style={{
        marginTop: 6,
        border: '1px solid var(--gray-100)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--white)',
        padding: 16,
      }}
    >
      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, letterSpacing: 0.3, color: 'var(--brand-blue, #1d4ed8)' }}>
        YOU’RE VISIBLE
      </p>
      <p style={{ margin: '6px 0 12px', fontSize: 14.5, lineHeight: 1.5, color: 'var(--gray-700)' }}>
        Your foundation is done, so companies can find you. These two are optional boosts that
        raise your strength when you’re ready.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Boost title="Add a 60-second intro video" sub="+30 strength" />
        <Boost title={`Take the ${BRAND.assessment} read`} sub="+25 strength" />
      </div>
      <Link href="/start/strength" style={{ display: 'inline-block', marginTop: 12, fontSize: 14, fontWeight: 700 }}>
        See your full profile strength ›
      </Link>
    </div>
  );
}

function Boost({ title, sub }: { title: string; sub: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
        background: 'var(--gray-050)',
        border: '1px solid var(--gray-100)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
      }}
    >
      <span style={{ fontSize: 14.5, fontWeight: 700 }}>{title}</span>
      <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--brand-red)' }}>{sub}</span>
    </div>
  );
}
