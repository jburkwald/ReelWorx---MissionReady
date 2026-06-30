'use client';

// Keyless demo — Hometown vs Open To (Feature 3.3 + relocation discoverability).
//
// Runs entirely in the browser: autocomplete is the isomorphic suggestLocations(), and the
// "who can find you" preview is demo company data, so this works with NO database, Clerk, or
// AI keys — exactly what deploys to Vercel from the repo. The point it makes: Hometown and
// Open To are TWO distinct, separately-searchable fields, and a company can find you by either.

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { suggestLocations, toLocationRef, type LocationRef } from '@reelworx/shared';

// A couple of demo companies sourcing in different regions, so both fields visibly pay off.
const DEMO_COMPANIES: { name: string; where: string; flag: string }[] = [
  { name: 'Ridgeline Logistics', where: 'Columbus, OH', flag: 'We hire veterans first.' },
  { name: 'Cumberland Freight', where: 'Nashville, TN', flag: 'Built by people who served.' },
  { name: 'Cascade Operations', where: 'Seattle, WA', flag: 'Mission over résumé.' },
];

const KIND_LABEL: Record<LocationRef['kind'], string> = {
  metro: 'City',
  state: 'State',
  region: 'Region',
  remote: 'Remote',
};

// Loose match: does a company's city fall within one of the candidate's places? Region/state
// entries match by their place words (e.g. "Anywhere in the Southeast" matches TN cities via
// the state set is out of scope for the demo — we keep it to direct city/state containment).
function placeMatches(companyWhere: string, place: string): boolean {
  const c = companyWhere.toLowerCase();
  const p = place.toLowerCase().replace(/^anywhere (in|on) the\s*/, '').replace(/,.*/, '').trim();
  if (!p) return false;
  // city match ("columbus, oh" contains "columbus") or state-abbrev match ("columbus, oh" ~ "oh")
  return c.includes(p) || p.includes(c.split(',')[0]);
}

export default function PlacesDemo() {
  const [hometown, setHometown] = useState<string | null>(null);
  const [openTo, setOpenTo] = useState<LocationRef[]>([]);

  const both = Boolean(hometown) && openTo.length > 0;

  // Who would surface you, and WHY — the two fields, shown working separately.
  const finders = useMemo(() => {
    return DEMO_COMPANIES.map((co) => {
      const byHome = hometown ? placeMatches(co.where, hometown) : false;
      const byOpen = openTo.some((o) => placeMatches(co.where, o.label));
      return { co, byHome, byOpen };
    }).filter((f) => f.byHome || f.byOpen);
  }, [hometown, openTo]);

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 24px 32px', gap: 22 }}>
      <div className="fade-in-up">
        <span className="display" style={{ fontSize: 17, letterSpacing: 1 }}>
          REELWORX MISSIONREADY
        </span>
        <div className="spectrum-bar" style={{ width: 52, height: 4, marginTop: 8 }} />
      </div>

      <div className="fade-in-up" style={{ animationDelay: '60ms' }}>
        <p className="muted" style={{ margin: 0, fontSize: 12.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Where you’re from, where you’d go
        </p>
        <h1 style={{ fontSize: 30, lineHeight: 1.1, fontWeight: 800, letterSpacing: -0.6, margin: '10px 0 0' }}>
          Two different things.
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--gray-700)', margin: '10px 0 0' }}>
          Your <strong>hometown</strong> is one place — it lets companies bring people home.
          The places you’re <strong>open to</strong> are however many you want. Both help the
          right companies find you, and they’re searched separately.
        </p>
      </div>

      {/* ── Hometown: single ─────────────────────────────────────────────── */}
      <Section title="Hometown" sub="The one place you’re from.">
        {hometown ? (
          <SelectedRow label={hometown} star onClear={() => setHometown(null)} clearLabel="Change" />
        ) : (
          <Picker placeholder="e.g. Columbus, OH" onPick={(r) => setHometown(r.label)} />
        )}
      </Section>

      {/* ── Open To: many ────────────────────────────────────────────────── */}
      <Section title="Open to moving" sub="A city, a state, or “anywhere in the Southeast.” Add as many as you like.">
        {openTo.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {openTo.map((p) => (
              <button
                key={p.label}
                onClick={() => setOpenTo((xs) => xs.filter((x) => x.label !== p.label))}
                className="chip"
                style={{ background: 'var(--gray-050)' }}
              >
                {p.label} <span style={{ color: 'var(--gray-400)', fontWeight: 700 }}>×</span>
              </button>
            ))}
          </div>
        )}
        <Picker
          placeholder="Add a place you’re open to"
          exclude={openTo.map((p) => p.label)}
          onPick={(r) =>
            setOpenTo((xs) =>
              xs.some((x) => x.label.toLowerCase() === r.label.toLowerCase()) ? xs : [...xs, r],
            )
          }
        />
      </Section>

      {/* ── Earned moment: the flag, only when both are set ──────────────── */}
      {both && (
        <div
          className="rise-in"
          style={{
            background: 'var(--black)',
            color: 'var(--white)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 20px',
            backgroundImage: 'linear-gradient(115deg, var(--brand-red), var(--brand-blue))',
          }}
        >
          <p style={{ margin: 0, fontWeight: 800, fontSize: 18 }}>You’re findable now.</p>
          <p style={{ margin: '6px 0 0', fontSize: 14, opacity: 0.92 }}>
            Companies can reach you whether they’re hiring near home or somewhere you’d move.
          </p>
        </div>
      )}

      {/* ── The payoff: who can find you, and why ────────────────────────── */}
      <Section title="Who can find you" sub="Live preview from companies sourcing across the country.">
        {finders.length === 0 ? (
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            Add a hometown or a place you’re open to, and matching companies show up here.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {finders.map(({ co, byHome, byOpen }) => (
              <div
                key={co.name}
                className="card"
                style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                  <strong style={{ fontSize: 15 }}>{co.name}</strong>
                  <span className="muted" style={{ fontSize: 12.5 }}>{co.where}</span>
                </div>
                <p className="muted" style={{ margin: 0, fontSize: 13 }}>{co.flag}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                  {byHome && <Badge tone="home">Come Home — your hometown</Badge>}
                  {byOpen && <Badge tone="open">You’re open to here</Badge>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Link
        href="/start"
        className="muted"
        style={{ fontSize: 13, textAlign: 'center', textDecoration: 'underline', marginTop: 4 }}
      >
        ‹ Back to start
      </Link>
    </main>
  );

  // ── local presentational helpers ──────────────────────────────────────
  function Section({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
    return (
      <section className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{title}</h2>
          <p className="muted" style={{ margin: '3px 0 0', fontSize: 13.5 }}>{sub}</p>
        </div>
        {children}
      </section>
    );
  }
}

function Picker({
  placeholder,
  onPick,
  exclude = [],
}: {
  placeholder: string;
  onPick: (ref: LocationRef) => void;
  exclude?: string[];
}) {
  const [query, setQuery] = useState('');
  const excludeSet = new Set(exclude.map((s) => s.toLowerCase()));
  const suggestions = query.trim()
    ? suggestLocations(query, 6).filter((s) => !excludeSet.has(s.label.toLowerCase()))
    : [];

  function pick(ref: LocationRef) {
    onPick(ref);
    setQuery('');
  }
  function submit() {
    const q = query.trim();
    if (!q) return;
    const top = suggestions[0];
    pick(top && top.label.toLowerCase() === q.toLowerCase() ? top : toLocationRef(q));
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder={placeholder}
        style={{
          width: '100%',
          height: 50,
          borderRadius: 'var(--radius-md)',
          background: 'var(--white)',
          border: `1px solid ${query.trim() ? 'var(--gray-900)' : 'var(--gray-100)'}`,
          padding: '0 16px',
          fontSize: 16,
          fontFamily: 'var(--font-body)',
          color: 'var(--gray-900)',
          outline: 'none',
        }}
      />
      {suggestions.length > 0 && (
        <div
          style={{
            marginTop: 8,
            border: '1px solid var(--gray-100)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            background: 'var(--white)',
            boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
          }}
        >
          {suggestions.map((s, i) => (
            <button
              key={s.label}
              onClick={() => pick(s)}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '13px 16px',
                background: 'var(--white)',
                border: 'none',
                borderTop: i === 0 ? 'none' : '1px solid var(--gray-100)',
                fontSize: 15,
                fontFamily: 'var(--font-body)',
                color: 'var(--gray-900)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span>{s.label}</span>
              <span className="muted" style={{ fontSize: 12 }}>{KIND_LABEL[s.kind]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SelectedRow({
  label,
  star,
  onClear,
  clearLabel,
}: {
  label: string;
  star?: boolean;
  onClear: () => void;
  clearLabel: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'var(--gray-050)',
        border: '1px solid var(--gray-900)',
        borderRadius: 'var(--radius-lg)',
        padding: '14px 16px',
      }}
    >
      {star && <span style={{ color: 'var(--brand-red)', fontSize: 18 }}>★</span>}
      <span style={{ flex: 1, fontSize: 16, fontWeight: 600 }}>{label}</span>
      <button
        onClick={onClear}
        style={{ background: 'none', border: 'none', color: 'var(--brand-red)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
      >
        {clearLabel}
      </button>
    </div>
  );
}

function Badge({ tone, children }: { tone: 'home' | 'open'; children: React.ReactNode }) {
  const isHome = tone === 'home';
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 700,
        padding: '4px 10px',
        borderRadius: 'var(--radius-full)',
        color: isHome ? 'var(--white)' : 'var(--brand-red)',
        background: isHome ? 'var(--brand-red)' : 'transparent',
        border: `1px solid var(--brand-red)`,
      }}
    >
      {children}
    </span>
  );
}
