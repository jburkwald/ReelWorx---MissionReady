'use client';

// ── MissionReady — blended shell PREVIEW (keyless, static, demoable from GitHub) ──────────
//
// Takes the strong bones of the pasted mockup — one unified shell, an RBAC context switcher
// (candidate <-> company memberships), dense dashboards, the compact component kit — and
// blends them into THIS product's rules:
//   • Dark + confident, but the palette is the real brand: black / white / RED, with flag
//     BLUE reserved for earned moments. No rainbow (BRAND doctrine, packages/shared theme).
//   • No gamification — no XP, streaks, levels, or Arena. Tokens stay an intent-signal
//     currency, not points. Celebration is earned, not decorative (BEHAVIORAL_DESIGN.md).
//   • Wired to real concepts we built: profile strength registry, Hometown/Open To with the
//     isomorphic location autocomplete, the company pipeline + Fit Read.
//
// It's a self-contained client component (no server imports) so it prerenders static and
// ships from the repo with zero keys.

import { useEffect, useState } from 'react';
import {
  STRENGTH_REGISTRY,
  suggestLocations,
  toLocationRef,
  type LocationRef,
} from '@reelworx/shared';
import { useVoiceAgent } from '../../lib/useVoiceAgent';

// ── Theme — real brand tokens on a dark canvas ───────────────────────────────────────────
const T = {
  bg: '#0A0A0F', surf: '#131218', card: '#1A1922', ln: '#26252F', ln2: '#322F3D',
  ink: '#F5F4F8', sub: '#97939F', dim: '#46434F',
  red: '#E4002B', redSoft: '#FF3D5E', redDim: 'rgba(228,0,43,0.12)', redLn: 'rgba(228,0,43,0.30)',
  blue: '#2D6CFF', blueDim: 'rgba(45,108,255,0.12)', blueLn: 'rgba(45,108,255,0.30)', // flag blue — earned moments only
  white: '#FFFFFF',
};

const GS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');
  .rw-prev *{box-sizing:border-box;}
  .rw-prev ::-webkit-scrollbar{width:3px;height:3px;} .rw-prev ::-webkit-scrollbar-thumb{background:${T.redLn};border-radius:99px;}
  .rw-prev input::placeholder,.rw-prev textarea::placeholder{color:${T.dim};}
  .rw-prev input:focus,.rw-prev textarea:focus{outline:none;}
  @keyframes rwUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes rwPop{0%{transform:scale(.96);opacity:0}100%{transform:scale(1);opacity:1}}
  .rw-fu{animation:rwUp .22s ease both;}
  .rw-pop{animation:rwPop .25s cubic-bezier(.16,1,.3,1) both;}
  .mono{font-family:'DM Mono',ui-monospace,monospace;}
  .disp{font-family:'Bebas Neue',sans-serif;letter-spacing:.04em;}
`;

// ── Tiny icon set ────────────────────────────────────────────────────────────────────────
const I = ({ n, s = 18, c = 'currentColor' }: { n: string; s?: number; c?: string }) => {
  const p = { fill: 'none', stroke: c, strokeWidth: '1.8', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const v = { width: s, height: s, viewBox: '0 0 24 24', style: { display: 'block', flexShrink: 0 } };
  const icons: Record<string, React.ReactNode> = {
    profile: <svg {...v}><path {...p} d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle {...p} cx="12" cy="7" r="4" /></svg>,
    spark: <svg {...v}><polygon {...p} points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
    pin: <svg {...v}><path {...p} d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0118 0z" /><circle {...p} cx="12" cy="10" r="3" /></svg>,
    target: <svg {...v}><circle {...p} cx="12" cy="12" r="9" /><circle {...p} cx="12" cy="12" r="4" /></svg>,
    msg: <svg {...v}><path {...p} d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>,
    coin: <svg {...v}><circle {...p} cx="12" cy="12" r="10" /><path {...p} d="M12 6v12M9 9h4.5a1.5 1.5 0 010 3H9m0 3h4.5a1.5 1.5 0 000-3H9" /></svg>,
    grid: <svg {...v}><rect {...p} x="3" y="3" width="7" height="7" rx="1.5" /><rect {...p} x="14" y="3" width="7" height="7" rx="1.5" /><rect {...p} x="3" y="14" width="7" height="7" rx="1.5" /><rect {...p} x="14" y="14" width="7" height="7" rx="1.5" /></svg>,
    brief: <svg {...v}><rect {...p} x="2" y="7" width="20" height="14" rx="2" /><path {...p} d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" /></svg>,
    users: <svg {...v}><path {...p} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle {...p} cx="9" cy="7" r="4" /><path {...p} d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>,
    chart: <svg {...v}><line {...p} x1="18" y1="20" x2="18" y2="10" /><line {...p} x1="12" y1="20" x2="12" y2="4" /><line {...p} x1="6" y1="20" x2="6" y2="14" /></svg>,
    team: <svg {...v}><circle {...p} cx="12" cy="8" r="4" /><path {...p} d="M4 21v-1a6 6 0 0112 0v1" /></svg>,
    card: <svg {...v}><rect {...p} x="2" y="5" width="20" height="14" rx="2" /><line {...p} x1="2" y1="10" x2="22" y2="10" /></svg>,
    check: <svg {...v}><polyline {...p} points="20 6 9 17 4 12" /></svg>,
    lock: <svg {...v}><rect {...p} x="3" y="11" width="18" height="11" rx="2" /><path {...p} d="M7 11V7a5 5 0 0110 0v4" /></svg>,
    down: <svg {...v}><polyline {...p} points="6 9 12 15 18 9" /></svg>,
    play: <svg {...v}><polygon {...p} points="6 4 20 12 6 20 6 4" /></svg>,
  };
  return <>{icons[n] ?? icons.grid}</>;
};

// ── Primitives ───────────────────────────────────────────────────────────────────────────
const Btn = ({ children, v = 'p', onClick, full, sm, dis }: any) => {
  const base: React.CSSProperties = { border: 'none', borderRadius: 9, cursor: dis ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: dis ? 0.45 : 1, width: full ? '100%' : 'auto', fontSize: sm ? 12 : 13, padding: sm ? '7px 14px' : '9px 18px', whiteSpace: 'nowrap', letterSpacing: '-.01em', transition: 'filter .12s,opacity .12s' };
  const styles: Record<string, React.CSSProperties> = {
    p: { ...base, background: T.red, color: '#fff' },
    flag: { ...base, background: T.blue, color: '#fff' },
    g: { ...base, background: T.surf, color: T.ink, border: `1px solid ${T.ln2}` },
    ghost: { ...base, background: 'transparent', color: T.sub, border: `1px solid ${T.ln2}` },
  };
  return <button onClick={onClick} disabled={dis} style={styles[v] ?? styles.p}>{children}</button>;
};

const Card = ({ children, sx = {}, ac }: any) => (
  <div style={{ background: T.card, border: `1px solid ${ac ? ac : T.ln}`, borderRadius: 12, padding: '14px 16px', ...sx }}>{children}</div>
);

const Tag = ({ c = T.red, children }: any) => (
  <span style={{ fontSize: 11, color: c, background: 'transparent', border: `1px solid ${c}55`, borderRadius: 5, padding: '2px 8px', whiteSpace: 'nowrap', fontWeight: 600 }}>{children}</span>
);

const Bar = ({ val = 0, c = T.red, h = 5 }: any) => (
  <div style={{ height: h, background: T.ln2, borderRadius: 99, overflow: 'hidden' }}>
    <div style={{ height: '100%', width: `${Math.min(100, val)}%`, background: c, borderRadius: 99, transition: 'width .5s cubic-bezier(.16,1,.3,1)' }} />
  </div>
);

const Banner = ({ title, sub, accent = T.red }: any) => (
  <div style={{ marginBottom: 18, paddingBottom: 14, borderBottom: `1px solid ${T.ln}`, display: 'flex', alignItems: 'center', gap: 12 }}>
    <div style={{ width: 4, height: 30, borderRadius: 99, background: accent, flexShrink: 0 }} />
    <div>
      <div style={{ fontWeight: 700, fontSize: 19, color: T.ink, lineHeight: 1.15 }}>{title}</div>
      {sub && <div style={{ color: T.sub, fontSize: 12.5, marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

const Tabs = ({ tabs, active, onTab }: any) => (
  <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: `1px solid ${T.ln}`, overflowX: 'auto' }}>
    {tabs.map((t: any) => (
      <button key={t.id} onClick={() => onTab(t.id)} style={{ padding: '9px 14px', background: 'transparent', border: 'none', borderBottom: `2px solid ${active === t.id ? T.red : 'transparent'}`, color: active === t.id ? T.ink : T.sub, fontSize: 13, fontWeight: active === t.id ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap', marginBottom: -1, fontFamily: 'inherit' }}>{t.label}</button>
    ))}
  </div>
);

const Stat = ({ v, l, c = T.red }: any) => (
  <div style={{ background: T.card, border: `1px solid ${T.ln}`, borderRadius: 11, padding: '12px 12px', textAlign: 'center' }}>
    <div className="disp" style={{ fontSize: 30, color: c, lineHeight: 1 }}>{v}</div>
    <div className="mono" style={{ color: T.sub, fontSize: 9.5, marginTop: 4, letterSpacing: '.06em', textTransform: 'uppercase' }}>{l}</div>
  </div>
);

const Field = ({ label, placeholder, value, onChange, rows }: any) => (
  <div style={{ marginBottom: 12 }}>
    {label && <div style={{ color: T.sub, fontSize: 12, fontWeight: 600, marginBottom: 5 }}>{label}</div>}
    {rows
      ? <textarea rows={rows} placeholder={placeholder} value={value} onChange={onChange} style={{ width: '100%', background: T.surf, border: `1px solid ${T.ln2}`, borderRadius: 8, padding: '9px 12px', color: T.ink, fontSize: 13, lineHeight: 1.6, resize: 'vertical', fontFamily: 'inherit' }} />
      : <input placeholder={placeholder} value={value} onChange={onChange} style={{ width: '100%', background: T.surf, border: `1px solid ${T.ln2}`, borderRadius: 8, padding: '9px 12px', color: T.ink, fontSize: 13, fontFamily: 'inherit' }} />}
  </div>
);

const Avatar = ({ name = '?', size = 36, self }: any) => {
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: self ? T.red : T.ln2, border: self ? 'none' : `1px solid ${T.ln2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, color: self ? '#fff' : T.ink, flexShrink: 0, userSelect: 'none' }}>{initials}</div>
  );
};

// ── RBAC — same session model as the mockup, gamification removed ─────────────────────────
const USER = {
  name: 'Marcus T.',
  roles: ['candidate'],
  memberships: [
    { companyId: 'co_midland', companyName: 'Midland Steel', membershipRole: 'admin', permissions: { can_post_job: true, can_view_analytics: true, can_manage_team: true, can_manage_billing: true } },
    { companyId: 'co_atlas', companyName: 'Atlas Mechanical', membershipRole: 'recruiter', permissions: { can_post_job: true, can_view_analytics: true, can_manage_team: false, can_manage_billing: false } },
  ],
};

function resolveContext(key: string) {
  if (key === 'candidate') return { mode: 'candidate' as const };
  const m = USER.memberships.find((x) => x.companyId === key);
  if (!m) return { mode: 'candidate' as const };
  return { mode: 'company' as const, companyId: m.companyId, companyName: m.companyName, membershipRole: m.membershipRole, permissions: m.permissions };
}

const TAB_CONFIG = [
  // Candidate — every tab maps to a real built feature (no Arena/XP/streaks)
  { id: 'profile', label: 'Profile', icon: 'profile', contextMode: 'candidate' },
  { id: 'strength', label: 'Strength', icon: 'spark', contextMode: 'candidate' },
  { id: 'fit', label: 'Fit Reads', icon: 'target', contextMode: 'candidate' },
  { id: 'places', label: 'Places', icon: 'pin', contextMode: 'candidate' },
  { id: 'messages', label: 'Messages', icon: 'msg', contextMode: 'candidate' },
  { id: 'tokens', label: 'Tokens', icon: 'coin', contextMode: 'candidate' },
  // Company — recruiter+
  { id: 'dashboard', label: 'Dashboard', icon: 'grid', contextMode: 'company' },
  { id: 'roles', label: 'Roles', icon: 'brief', contextMode: 'company', requirePerm: 'can_post_job' },
  { id: 'applicants', label: 'Applicants', icon: 'users', contextMode: 'company' },
  { id: 'analytics', label: 'Analytics', icon: 'chart', contextMode: 'company', requirePerm: 'can_view_analytics' },
  { id: 'messages_co', label: 'Messages', icon: 'msg', contextMode: 'company' },
  // Company — admin
  { id: 'team', label: 'Team', icon: 'team', contextMode: 'company', requireRole: 'admin', requirePerm: 'can_manage_team' },
  { id: 'billing', label: 'Billing', icon: 'card', contextMode: 'company', requireRole: 'admin', requirePerm: 'can_manage_billing' },
];

function visibleTabs(ctx: any) {
  return TAB_CONFIG.filter((t) => {
    if (t.contextMode !== ctx.mode) return false;
    if (t.requireRole && ctx.mode === 'company' && ctx.membershipRole !== t.requireRole) return false;
    if (t.requirePerm && ctx.mode === 'company' && !ctx.permissions?.[t.requirePerm as keyof typeof ctx.permissions]) return false;
    return true;
  });
}

// ── Candidate · Profile ──────────────────────────────────────────────────────────────────
function ProfilePage() {
  const history = [
    { role: 'Senior Fabricator', co: 'Midwest Industrial', yrs: '2022–2024', why: 'Took the lead role to own quality end-to-end; left in an economic layoff, not for lack of work.' },
    { role: 'Fabricator II', co: 'Great Lakes Steel', yrs: '2020–2022', why: 'Moved up after proving out on structural welds. Relocated for family.' },
    { role: 'Junior Fabricator', co: 'Titan Fabrication', yrs: '2018–2020', why: 'Where it started. Learned the trade on the floor; company was sold.' },
  ];
  const skills = [['MIG Welding', 95], ['Structural Fabrication', 90], ['Blueprint Reading', 85], ['TIG Welding', 78], ['Quality Inspection', 70], ['CNC Operation', 62]] as const;
  return (
    <div className="rw-fu">
      <Banner title="My Profile" sub="Marcus T. — Senior Structural Fabricator · Milwaukee, WI" />
      <Card sx={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>
        <div style={{ height: 70, background: `linear-gradient(110deg,${T.red},${T.blue})` }} />
        <div style={{ padding: '0 16px 16px', marginTop: -24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
            <Avatar name="Marcus T." size={52} self />
            <div style={{ display: 'flex', gap: 6 }}><Btn sm v="g">Edit</Btn><Btn sm v="p">View public</Btn></div>
          </div>
          <div style={{ fontWeight: 800, fontSize: 17, color: T.ink }}>Marcus T.</div>
          <div style={{ color: T.sub, fontSize: 12.5, marginTop: 2 }}>Senior Structural Fabricator · Milwaukee, WI</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            <Tag c={T.red}>Available now</Tag><Tag c={T.blue}>Verified</Tag>
          </div>
        </div>
      </Card>
      <Card sx={{ marginBottom: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: T.ink, marginBottom: 12 }}>Work history — the why behind each move</div>
        {history.map((j, i) => (
          <div key={i} style={{ padding: '10px 0', borderBottom: i < history.length - 1 ? `1px solid ${T.ln}` : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: T.ink }}>{j.role}</span>
              <span className="mono" style={{ color: T.sub, fontSize: 11 }}>{j.yrs}</span>
            </div>
            <div style={{ color: T.sub, fontSize: 12, marginTop: 1 }}>{j.co}</div>
            <div style={{ color: T.ink, fontSize: 12.5, lineHeight: 1.6, marginTop: 6, paddingLeft: 10, borderLeft: `2px solid ${T.redLn}` }}>{j.why}</div>
          </div>
        ))}
      </Card>
      <Card>
        <div style={{ fontWeight: 700, fontSize: 13, color: T.ink, marginBottom: 14 }}>Skills</div>
        {skills.map(([s, v]) => (
          <div key={s} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}><span style={{ color: T.ink, fontWeight: 600 }}>{s}</span><span className="mono" style={{ color: T.sub }}>{v}%</span></div>
            <Bar val={v} />
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── Candidate · Strength (real registry, no points/levels) ───────────────────────────────
function StrengthPage() {
  const done: Record<string, boolean> = { foundation: true, video: true, assessment: true };
  const score = STRENGTH_REGISTRY.filter((c) => c.enabled && done[c.id]).reduce((s, c) => s + c.weight, 0);
  const max = STRENGTH_REGISTRY.filter((c) => c.enabled).reduce((s, c) => s + c.weight, 0);
  return (
    <div className="rw-fu">
      <Banner title="Profile Strength" sub="Built from real signal, not fields filled in" />
      <Card sx={{ marginBottom: 12, background: `linear-gradient(120deg,${T.redDim},transparent)`, borderColor: T.redLn }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 10 }}>
          <span className="disp" style={{ fontSize: 56, color: T.red, lineHeight: 0.85 }}>{score}</span>
          <span style={{ color: T.sub, fontSize: 14, marginBottom: 6 }}>/ {max} · Standout</span>
        </div>
        <Bar val={(score / max) * 100} h={7} />
      </Card>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {STRENGTH_REGISTRY.map((c) => {
          const locked = !c.enabled;
          const complete = done[c.id];
          const accent = complete ? T.blue : locked ? T.dim : T.red;
          return (
            <Card key={c.id} ac={complete ? T.blueLn : T.ln}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: complete ? T.blueDim : locked ? T.surf : T.redDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <I n={complete ? 'check' : locked ? 'lock' : 'spark'} s={17} c={accent} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: locked ? T.sub : T.ink }}>{c.label}</span>
                    <span className="mono" style={{ fontSize: 11, color: accent }}>{complete ? 'Done' : locked ? 'Soon' : `+${c.weight}`}</span>
                  </div>
                  <div style={{ color: T.sub, fontSize: 12, marginTop: 2, lineHeight: 1.5 }}>{c.blurb}</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── Candidate · Places (real hometown / open-to, reusing the location autocomplete) ───────
function PlacesPage() {
  const [hometown, setHometown] = useState<string | null>('Columbus, OH');
  const [openTo, setOpenTo] = useState<LocationRef[]>([
    { label: 'Milwaukee, WI', kind: 'metro' }, { label: 'Anywhere in the Midwest', kind: 'region' },
  ]);
  const [q, setQ] = useState('');
  const [editHome, setEditHome] = useState(false);
  const sugg = q.trim() ? suggestLocations(q, 6).filter((s) => !openTo.some((o) => o.label.toLowerCase() === s.label.toLowerCase())) : [];
  return (
    <div className="rw-fu">
      <Banner title="Places" sub="Where you're from, and where you'd go — two different things" accent={T.blue} />
      <Card sx={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: T.ink }}>Hometown</div>
        <div style={{ color: T.sub, fontSize: 12, margin: '3px 0 10px' }}>One place. Powers the “Come Home” search.</div>
        {hometown && !editHome ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.surf, border: `1px solid ${T.redLn}`, borderRadius: 10, padding: '12px 14px' }}>
            <span style={{ color: T.red, fontSize: 16 }}>★</span>
            <span style={{ flex: 1, fontWeight: 600, color: T.ink }}>{hometown}</span>
            <button onClick={() => setEditHome(true)} style={{ background: 'none', border: 'none', color: T.red, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Change</button>
          </div>
        ) : (
          <input autoFocus placeholder="e.g. Columbus, OH" onKeyDown={(e: any) => { if (e.key === 'Enter' && e.target.value.trim()) { setHometown(toLocationRef(e.target.value).label); setEditHome(false); } }} style={{ width: '100%', background: T.surf, border: `1px solid ${T.ln2}`, borderRadius: 9, padding: '11px 14px', color: T.ink, fontSize: 14, fontFamily: 'inherit' }} />
        )}
      </Card>
      <Card>
        <div style={{ fontWeight: 700, fontSize: 13, color: T.ink }}>Open to moving</div>
        <div style={{ color: T.sub, fontSize: 12, margin: '3px 0 10px' }}>However many you want — a city, a state, or “anywhere in the Southeast.”</div>
        {openTo.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 10 }}>
            {openTo.map((p) => (
              <button key={p.label} onClick={() => setOpenTo((xs) => xs.filter((x) => x.label !== p.label))} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: T.surf, border: `1px solid ${T.ln2}`, borderRadius: 99, padding: '7px 13px', color: T.ink, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{p.label} <span style={{ color: T.dim }}>×</span></button>
            ))}
          </div>
        )}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Add a place you're open to" style={{ width: '100%', background: T.surf, border: `1px solid ${q.trim() ? T.ink : T.ln2}`, borderRadius: 9, padding: '11px 14px', color: T.ink, fontSize: 14, fontFamily: 'inherit' }} />
        {sugg.length > 0 && (
          <div className="rw-pop" style={{ marginTop: 8, border: `1px solid ${T.ln2}`, borderRadius: 11, overflow: 'hidden' }}>
            {sugg.map((s, i) => (
              <button key={s.label} onClick={() => { setOpenTo((xs) => [...xs, s]); setQ(''); }} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', background: T.card, border: 'none', borderTop: i ? `1px solid ${T.ln}` : 'none', color: T.ink, fontSize: 14, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                <span>{s.label}</span><span className="mono" style={{ fontSize: 11, color: T.sub }}>{s.kind}</span>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Candidate · Tokens (intent currency — NOT points) ────────────────────────────────────
function TokensPage() {
  return (
    <div className="rw-fu">
      <Banner title="Tokens" sub="Your reach is finite on purpose — so it means something" />
      <Card sx={{ marginBottom: 14, background: `linear-gradient(120deg,${T.redDim},transparent)`, borderColor: T.redLn }}>
        <div className="mono" style={{ fontSize: 10, color: T.sub, letterSpacing: '.1em', marginBottom: 4 }}>BALANCE</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}><span className="disp" style={{ fontSize: 52, color: T.ink, lineHeight: 0.85 }}>11</span><span style={{ color: T.sub, fontSize: 14, marginBottom: 6 }}>application tokens</span></div>
        <div style={{ color: T.sub, fontSize: 12.5, marginTop: 8, lineHeight: 1.55 }}>An application costs a token. That cost is the point: it makes every outreach a real signal to an employer, not noise. Renews monthly.</div>
      </Card>
      <div style={{ fontWeight: 700, fontSize: 13, color: T.ink, marginBottom: 8 }}>Earn more by deepening your profile</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[['Record your intro video', '+2', false], ['Add a specific moment to a role', '+1', false], ['Refer someone from your unit', '+5', false]].map(([l, r, done]: any) => (
          <Card key={l} sx={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, color: T.ink, fontSize: 13, fontWeight: 600 }}>{l}</div>
            <Tag c={done ? T.blue : T.red}>{r}</Tag>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Company · Dashboard ──────────────────────────────────────────────────────────────────
function DashboardPage({ ctx }: any) {
  const roles = [{ title: 'Senior Structural Fabricator', apps: 23, pay: '$28–$34/hr', urgent: true }, { title: 'Lead MIG Welder', apps: 14, pay: '$25–$31/hr' }, { title: 'Shop Supervisor', apps: 10, pay: '$35–$44/hr' }];
  return (
    <div className="rw-fu">
      <Banner title="Pipeline" sub={`${ctx.companyName} · is this working?`} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(96px,1fr))', gap: 8, marginBottom: 16 }}>
        <Stat v="247" l="Views" /><Stat v="47" l="Applied" /><Stat v="12" l="Talking" /><Stat v="3" l="Hires" c={T.blue} />
      </div>
      <Card sx={{ marginBottom: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: T.ink, marginBottom: 10 }}>Active roles</div>
        {roles.map((j, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 0', borderBottom: i < roles.length - 1 ? `1px solid ${T.ln}` : 'none' }}>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 13, color: T.ink }}>{j.title}</div><div style={{ color: T.sub, fontSize: 12 }}>{j.pay} · {j.apps} applicants</div></div>
            {j.urgent && <Tag c={T.red}>Urgent</Tag>}
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── Company · Applicants (Fit Read) ──────────────────────────────────────────────────────
function ApplicantsPage({ ctx }: any) {
  const apps = [
    { name: 'Marcus T.', role: 'Sr Fabricator', match: 94, why: 'Ran a 45-person logistics floor under pressure — built to run a shop.' },
    { name: 'Jason K.', role: 'Lead Welder', match: 87, why: 'Deep structural welding background; strong on conscientiousness.' },
    { name: 'Deon R.', role: 'CNC Machinist', match: 79, why: 'High drive, early in transition; would grow into the role fast.' },
  ];
  return (
    <div className="rw-fu">
      <Banner title="Applicants" sub={`${ctx.companyName} · sorted by fit`} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {apps.map((a, i) => (
          <Card key={i}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Avatar name={a.name} size={40} />
              <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 13, color: T.ink }}>{a.name}</div><div style={{ color: T.sub, fontSize: 12 }}>{a.role}</div></div>
              <div style={{ textAlign: 'right' }}>
                <div className="disp" style={{ fontSize: 28, color: a.match > 90 ? T.blue : T.red, lineHeight: 1 }}>{a.match}%</div>
                <div className="mono" style={{ color: T.sub, fontSize: 9 }}>FIT</div>
              </div>
            </div>
            <div style={{ color: T.ink, fontSize: 12.5, lineHeight: 1.6, marginTop: 10, paddingLeft: 10, borderLeft: `2px solid ${a.match > 90 ? T.blueLn : T.redLn}` }}>{a.why}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Company · Analytics ──────────────────────────────────────────────────────────────────
function AnalyticsPage({ ctx }: any) {
  const funnel = [['Views → Clicks', 247, 47], ['Clicks → Applied', 47, 23], ['Applied → Talking', 23, 12], ['Talking → Hire', 12, 3]] as const;
  return (
    <div className="rw-fu">
      <Banner title="Analytics" sub={`${ctx.companyName} · last 30 days`} />
      <Card>
        <div style={{ fontWeight: 700, fontSize: 13, color: T.ink, marginBottom: 14 }}>Hiring funnel</div>
        {funnel.map(([l, from, to], i) => (
          <div key={l} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}><span style={{ color: T.sub }}>{l}</span><span className="mono" style={{ color: i === funnel.length - 1 ? T.blue : T.red }}>{from} → {to}</span></div>
            <Bar val={(to / from) * 100} c={i === funnel.length - 1 ? T.blue : T.red} />
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── Candidate · Fit Reads (hero — honest fit, with the why AND the gap) ──────────────────
function FitReadsPage() {
  const reads = [
    { co: 'Midland Steel', role: 'Senior Structural Fabricator', score: 94, why: 'You ran a floor under pressure and own quality end-to-end — exactly how this team works.', gap: null },
    { co: 'Cumberland Freight', role: 'Shop Lead', score: 81, why: 'Strong leadership signal and the trade depth they need.', gap: 'They lean on CNC programming day to day — worth naming where you are with it.' },
    { co: 'Great Lakes Mfg', role: 'Fabricator II', score: 68, why: 'Solid craft match and local roots.', gap: 'More of a step sideways than up — fit is real but the growth is thinner.' },
  ];
  return (
    <div className="rw-fu">
      <Banner title="Fit Reads" sub="Companies matched to who you actually are — the why, and the honest gap" accent={T.blue} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {reads.map((r, i) => {
          const top = r.score >= 90;
          return (
            <Card key={i} ac={top ? T.blueLn : T.ln} sx={top ? { background: `linear-gradient(120deg,${T.blueDim},transparent)` } : {}}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name={r.co} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: T.ink }}>{r.co}</div>
                  <div style={{ color: T.sub, fontSize: 12 }}>{r.role}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="disp" style={{ fontSize: 30, color: top ? T.blue : T.red, lineHeight: 1 }}>{r.score}%</div>
                  <div className="mono" style={{ color: T.sub, fontSize: 9 }}>{top ? 'EXCEPTIONAL' : 'FIT'}</div>
                </div>
              </div>
              <div style={{ color: T.ink, fontSize: 12.5, lineHeight: 1.6, marginTop: 10, paddingLeft: 10, borderLeft: `2px solid ${top ? T.blueLn : T.redLn}` }}>{r.why}</div>
              {r.gap && <div style={{ color: T.sub, fontSize: 12, lineHeight: 1.55, marginTop: 8, paddingLeft: 10 }}><span style={{ color: T.sub, fontWeight: 700 }}>The gap: </span>{r.gap}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <Btn sm v={top ? 'flag' : 'p'}>Reach out · 1 token</Btn>
                <Btn sm v="ghost">See company</Btn>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── Company · Team & Permissions (admin-only — also proves the RBAC gate) ─────────────────
function TeamPage({ ctx }: any) {
  const members = [
    { name: 'Sarah King', role: 'admin', email: 'sarah@midlandsteel.com' },
    { name: 'Derek Hall', role: 'recruiter', email: 'derek@midlandsteel.com' },
    { name: 'Tina Marsh', role: 'recruiter', email: 'tina@midlandsteel.com' },
  ];
  return (
    <div className="rw-fu">
      <Banner title="Team & Permissions" sub={`${ctx.companyName} · admin only`} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}><Btn sm v="p">+ Invite member</Btn></div>
      {members.map((m, i) => (
        <Card key={i} sx={{ marginBottom: 8, display: 'flex', gap: 12, alignItems: 'center' }}>
          <Avatar name={m.name} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: T.ink }}>{m.name}</div>
            <div style={{ color: T.sub, fontSize: 11.5, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</div>
          </div>
          <Tag c={m.role === 'admin' ? T.red : T.blue}>{m.role}</Tag>
          <Btn sm v="g">Edit role</Btn>
        </Card>
      ))}
    </div>
  );
}

// ── Company · Billing & Plan (admin only) ────────────────────────────────────────────────
function BillingPage({ ctx }: any) {
  const rows = [['Plan', 'Pro · unlimited roles, priority matching'], ['Next billing', 'March 15, 2026'], ['Amount', '$149 / mo'], ['Invite tokens', '47 remaining']];
  const invoices = [['Feb 15, 2026', '$149.00', 'Paid'], ['Jan 15, 2026', '$149.00', 'Paid'], ['Dec 15, 2025', '$149.00', 'Paid']];
  return (
    <div className="rw-fu">
      <Banner title="Billing & Plan" sub={`${ctx.companyName} · admin only`} />
      <Card sx={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.ink }}>Pro Plan</div>
          <Tag c={T.blue}>Active</Tag>
        </div>
        {rows.map(([l, v], i) => (
          <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: i ? `1px solid ${T.ln}` : 'none', fontSize: 13 }}>
            <span style={{ color: T.sub }}>{l}</span>
            <span style={{ color: l === 'Invite tokens' ? T.red : T.ink, fontWeight: 600 }} className={l === 'Invite tokens' ? 'mono' : ''}>{v}</span>
          </div>
        ))}
      </Card>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <Btn v="g" full>Update payment</Btn>
        <Btn v="p" full>Buy invite tokens</Btn>
      </div>
      <Card>
        <div style={{ fontWeight: 700, fontSize: 13, color: T.ink, marginBottom: 8 }}>Invoices</div>
        {invoices.map(([d, amt, st], i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < invoices.length - 1 ? `1px solid ${T.ln}` : 'none' }}>
            <span style={{ flex: 1, color: T.ink, fontSize: 12.5 }}>{d}</span>
            <span className="mono" style={{ color: T.sub, fontSize: 12.5 }}>{amt}</span>
            <Tag c={T.blue}>{st}</Tag>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── Voice guide — wires the existing voice agent into the shell. Works tonight on the
// browser's built-in voice; flips to HD "Brian" automatically once ELEVENLABS_API_KEY is on
// the server. Candidate-context only (Marcus is voice-first; Karen on web is not).
function VoiceGuide() {
  const voice = useVoiceAgent();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const line =
    "Welcome to MissionReady. I'm your guide. We build your story by talking it through, not by filling out forms. Tap any section and I'll walk you through it, and you can stop whenever you want.";
  // Mount-gate so the static prerender (no window) and the client agree — no hydration flash.
  if (!mounted || !voice.supported.tts) return null;
  const hd = Boolean(voice.premium.provider);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: T.card, border: `1px solid ${T.ln}`, borderRadius: 12, padding: '10px 14px', marginBottom: 16 }}>
      <div style={{ width: 34, height: 34, borderRadius: '50%', background: hd ? T.blueDim : T.redDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <I n="play" s={15} c={hd ? T.blue : T.red} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: T.ink }}>Voice guide</div>
        <div className="mono" style={{ fontSize: 10, color: hd ? T.blue : T.sub, letterSpacing: '.04em' }}>{hd ? 'HD VOICE · ELEVENLABS' : 'BROWSER VOICE · HD WHEN KEY ADDED'}</div>
      </div>
      <Btn sm v={voice.speaking ? 'g' : 'p'} onClick={() => (voice.speaking ? voice.cancel() : voice.speak(line))}>
        {voice.speaking ? 'Stop' : 'Hear it'}
      </Btn>
    </div>
  );
}

// ── Generic surfaces for the remaining real tabs ─────────────────────────────────────────
function RolesPage({ ctx }: any) {
  return (
    <div className="rw-fu">
      <Banner title="Post a Role" sub={`${ctx.companyName} · describe it like you'd tell a friend`} />
      <Card>
        <Field label="In plain language, what is this role?" placeholder="I need someone relentless who can run a fabrication floor and isn't rattled when things go sideways..." rows={4} />
        <div style={{ background: T.surf, border: `1px solid ${T.ln2}`, borderRadius: 10, padding: '12px 14px', margin: '4px 0 12px' }}>
          <div className="mono" style={{ fontSize: 10, color: T.sub, letterSpacing: '.08em', marginBottom: 8 }}>DERIVED FIT PROFILE</div>
          {[['Resilience & drive', 88], ['Conscientiousness', 80], ['Interpersonal EQ', 72]].map(([l, v]: any) => (
            <div key={l} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}><span style={{ color: T.ink }}>{l}</span><span className="mono" style={{ color: T.red }}>{v}</span></div>
              <Bar val={v} />
            </div>
          ))}
        </div>
        <Btn full v="p">Build role · 1 token</Btn>
      </Card>
    </div>
  );
}

function SimpleMessages() {
  return (
    <div className="rw-fu">
      <Banner title="Messages" sub="Conversations you've started" accent={T.blue} />
      {[['Midland Steel HR', "Let's do Tuesday at 2pm.", true], ['Atlas Mechanical', 'Thanks for applying — reviewing now.', true], ['Great Lakes Mfg', 'Your story stood out to the team.', false]].map(([n, last, unread]: any) => (
        <Card key={n} sx={{ marginBottom: 8, display: 'flex', gap: 12, alignItems: 'center' }}>
          <Avatar name={n} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: 13, color: T.ink }}>{n}</div><div style={{ color: T.sub, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{last}</div></div>
          {unread && <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.red }} />}
        </Card>
      ))}
    </div>
  );
}

function Placeholder({ title, sub }: any) {
  return (
    <div className="rw-fu">
      <Banner title={title} sub={sub} />
      <Card sx={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ color: T.sub, fontSize: 13, lineHeight: 1.6, maxWidth: 320, margin: '0 auto' }}>This surface is part of the blended shell. Wired the same way as the live pages — say the word and I'll connect it to the real backend.</div>
      </Card>
    </div>
  );
}

// ── Shell ────────────────────────────────────────────────────────────────────────────────
export default function Preview() {
  const [ctxKey, setCtxKey] = useState('candidate');
  const [sec, setSec] = useState('profile');
  const [slim, setSlim] = useState(false);
  const [switcher, setSwitcher] = useState(false);

  const ctx = resolveContext(ctxKey);
  const tabs = visibleTabs(ctx);
  const safeSec = tabs.find((t) => t.id === sec) ? sec : tabs[0]?.id ?? 'profile';

  const options = [
    { key: 'candidate', label: USER.name, sub: 'Candidate' },
    ...USER.memberships.map((m) => ({ key: m.companyId, label: m.companyName, sub: m.membershipRole === 'admin' ? 'Admin' : 'Recruiter' })),
  ];
  const active = options.find((o) => o.key === ctxKey) ?? options[0];

  function render(id: string) {
    if (ctx.mode === 'candidate') {
      if (id === 'profile') return <ProfilePage />;
      if (id === 'strength') return <StrengthPage />;
      if (id === 'fit') return <FitReadsPage />;
      if (id === 'places') return <PlacesPage />;
      if (id === 'messages') return <SimpleMessages />;
      if (id === 'tokens') return <TokensPage />;
    } else {
      if (id === 'dashboard') return <DashboardPage ctx={ctx} />;
      if (id === 'roles') return <RolesPage ctx={ctx} />;
      if (id === 'applicants') return <ApplicantsPage ctx={ctx} />;
      if (id === 'analytics') return <AnalyticsPage ctx={ctx} />;
      if (id === 'messages_co') return <SimpleMessages />;
      if (id === 'team') return <TeamPage ctx={ctx} />;
      if (id === 'billing') return <BillingPage ctx={ctx} />;
    }
    return <Placeholder title="Not found" sub="" />;
  }

  return (
    <div className="rw-prev" style={{ display: 'flex', height: '100vh', background: T.bg, color: T.ink, fontFamily: "'DM Sans',system-ui,sans-serif", overflow: 'hidden' }}>
      <style>{GS}</style>

      {/* Sidebar */}
      <div style={{ width: slim ? 60 : 210, background: `linear-gradient(180deg,#16070E 0%,${T.surf} 40%,${T.bg} 100%)`, borderRight: `1px solid ${T.ln}`, display: 'flex', flexDirection: 'column', flexShrink: 0, transition: 'width .2s cubic-bezier(.16,1,.3,1)', overflow: 'hidden' }}>
        <button onClick={() => setSlim((s) => !s)} style={{ padding: '14px 16px', borderBottom: `1px solid ${T.ln}`, display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', minHeight: 56, width: '100%' }}>
          <svg width="24" height="24" viewBox="0 0 100 100" fill="none" style={{ flexShrink: 0 }}><circle cx="50" cy="50" r="44" stroke={T.red} strokeWidth="9" /><polygon points="40,30 40,70 74,50" fill={T.red} /></svg>
          {!slim && <span className="disp" style={{ fontSize: 18, color: T.ink }}>MISSIONREADY</span>}
        </button>

        {/* context pill */}
        {!slim && (
          <div style={{ margin: 10, padding: '8px 11px', background: ctx.mode === 'company' ? T.blueDim : T.redDim, border: `1px solid ${ctx.mode === 'company' ? T.blueLn : T.redLn}`, borderRadius: 10 }}>
            <div className="mono" style={{ fontSize: 9, color: T.sub, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 3 }}>{ctx.mode === 'company' ? 'Company' : 'Candidate'}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: ctx.mode === 'company' ? T.blue : T.red }}>{ctx.mode === 'company' ? ctx.companyName : USER.name}</div>
          </div>
        )}

        <nav style={{ flex: 1, padding: 6, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {tabs.map((item) => {
            const on = safeSec === item.id;
            return (
              <button key={item.id} onClick={() => setSec(item.id)} title={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: slim ? '11px 0' : '9px 11px', justifyContent: slim ? 'center' : 'flex-start', borderRadius: 9, border: 'none', cursor: 'pointer', background: on ? T.redDim : 'transparent', color: on ? T.red : T.sub, borderLeft: on && !slim ? `2px solid ${T.red}` : '2px solid transparent', fontFamily: 'inherit' }}>
                <I n={item.icon} s={17} c={on ? T.red : T.sub} />
                {!slim && <span style={{ fontWeight: on ? 700 : 400, fontSize: 13 }}>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* context switcher */}
        <div style={{ borderTop: `1px solid ${T.ln}`, position: 'relative' }}>
          <button onClick={() => setSwitcher((o) => !o)} style={{ width: '100%', padding: slim ? '12px 8px' : '12px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, fontFamily: 'inherit' }}>
            <Avatar name={active.label} size={28} self={ctxKey === 'candidate'} />
            {!slim && <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}><div style={{ color: T.ink, fontWeight: 700, fontSize: 11.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{active.label}</div><div style={{ color: ctx.mode === 'company' ? T.blue : T.sub, fontSize: 10 }}>{active.sub}</div></div>}
            {!slim && <I n="down" s={12} c={T.sub} />}
          </button>
          {switcher && (
            <div className="rw-pop" style={{ position: 'absolute', bottom: '100%', left: slim ? 60 : 8, width: 196, background: T.card, border: `1px solid ${T.ln2}`, borderRadius: 11, padding: 6, zIndex: 50, boxShadow: '0 12px 40px rgba(0,0,0,.6)' }}>
              <div className="mono" style={{ fontSize: 9, color: T.sub, letterSpacing: '.08em', textTransform: 'uppercase', padding: '4px 8px 6px' }}>Switch context</div>
              {options.map((o) => (
                <button key={o.key} onClick={() => { setCtxKey(o.key); setSwitcher(false); setSec(visibleTabs(resolveContext(o.key))[0]?.id ?? 'profile'); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: 8, borderRadius: 8, border: 'none', background: ctxKey === o.key ? T.redDim : 'transparent', cursor: 'pointer', marginBottom: 2, fontFamily: 'inherit' }}>
                  <Avatar name={o.label} size={26} self={o.key === 'candidate'} />
                  <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}><div style={{ color: T.ink, fontWeight: 600, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.label}</div><div style={{ color: ctxKey === o.key ? T.red : T.sub, fontSize: 10 }}>{o.sub}</div></div>
                  {ctxKey === o.key && <I n="check" s={12} c={T.red} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main */}
      <div key={`${ctxKey}:${safeSec}`} style={{ flex: 1, overflowY: 'auto', padding: '22px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          {ctx.mode === 'candidate' && <VoiceGuide />}
          {render(safeSec)}
        </div>
      </div>
    </div>
  );
}
