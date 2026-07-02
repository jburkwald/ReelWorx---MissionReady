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

import { useEffect, useRef, useState } from 'react';
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
    search: <svg {...v}><circle {...p} cx="11" cy="11" r="7" /><line {...p} x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
    compass: <svg {...v}><circle {...p} cx="12" cy="12" r="10" /><polygon {...p} points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></svg>,
    inbox: <svg {...v}><polyline {...p} points="22 12 16 12 14 15 10 15 8 12 2 12" /><path {...p} d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" /></svg>,
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
  { id: 'video', label: 'Intro video', icon: 'play', contextMode: 'candidate' },
  { id: 'insight', label: 'Insight', icon: 'compass', contextMode: 'candidate' },
  { id: 'strength', label: 'Strength', icon: 'spark', contextMode: 'candidate' },
  { id: 'jobs', label: 'Openings', icon: 'brief', contextMode: 'candidate' },
  { id: 'applications', label: 'Applications', icon: 'inbox', contextMode: 'candidate' },
  { id: 'fit', label: 'Fit Reads', icon: 'target', contextMode: 'candidate' },
  { id: 'places', label: 'Places', icon: 'pin', contextMode: 'candidate' },
  { id: 'messages', label: 'Messages', icon: 'msg', contextMode: 'candidate' },
  { id: 'tokens', label: 'Tokens', icon: 'coin', contextMode: 'candidate' },
  // Company — recruiter+
  { id: 'dashboard', label: 'Dashboard', icon: 'grid', contextMode: 'company' },
  { id: 'source', label: 'Source', icon: 'search', contextMode: 'company' },
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

// ── Candidate · Profile — living, deepening, two outputs ─────────────────────────────────
function ProfilePage() {
  // The depth layer (spec: ONE specific follow-up question per section, answer gets woven
  // into the narrative, not appended as a note).
  const [momentText, setMomentText] = useState('');
  const [woven, setWoven] = useState(false);
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
        {history.map((j, i) => {
          const whyText = i === 0 && woven && momentText.trim() ? `${j.why} ${momentText.trim()}` : j.why;
          return (
            <div key={i} style={{ padding: '10px 0', borderBottom: i < history.length - 1 ? `1px solid ${T.ln}` : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: T.ink }}>{j.role}</span>
                <span className="mono" style={{ color: T.sub, fontSize: 11 }}>{j.yrs}</span>
              </div>
              <div style={{ color: T.sub, fontSize: 12, marginTop: 1 }}>{j.co}</div>
              <div style={{ color: T.ink, fontSize: 12.5, lineHeight: 1.6, marginTop: 6, paddingLeft: 10, borderLeft: `2px solid ${i === 0 && woven ? T.blueLn : T.redLn}` }}>{whyText}</div>
            </div>
          );
        })}
      </Card>

      {/* The depth layer — one specific question, woven into the story (never a form) */}
      <Card sx={{ marginBottom: 10 }} ac={woven ? T.blueLn : T.redLn}>
        {!woven ? (
          <>
            <div className="mono" style={{ fontSize: 10, color: T.red, letterSpacing: '.08em', marginBottom: 8 }}>GO DEEPER · SENIOR FABRICATOR</div>
            <div style={{ color: T.ink, fontSize: 13.5, lineHeight: 1.6, fontStyle: 'italic', marginBottom: 10 }}>
              “When you were running that floor, was there a moment where everything went wrong and you had to figure it out anyway? I'd love to add that to your story.”
            </div>
            <textarea rows={3} value={momentText} onChange={(e) => setMomentText(e.target.value)} placeholder="Tell it the way you'd tell a friend — a specific day, what broke, what you did..." style={{ width: '100%', background: T.surf, border: `1px solid ${T.ln2}`, borderRadius: 8, padding: '9px 12px', color: T.ink, fontSize: 13, lineHeight: 1.6, resize: 'vertical', fontFamily: 'inherit', marginBottom: 10 }} />
            <Btn full v="p" dis={!momentText.trim()} onClick={() => setWoven(true)}>Weave it into my story</Btn>
          </>
        ) : (
          <div className="rw-pop" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: T.blueDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><I n="check" s={16} c={T.blue} /></div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.blue }}>Story deepened.</div>
              <div style={{ color: T.sub, fontSize: 12, marginTop: 1 }}>Woven into your Senior Fabricator chapter above — not tacked on as a note.</div>
            </div>
          </div>
        )}
      </Card>

      {/* One profile, two outputs — the human story + the ATS-safe document */}
      <Card sx={{ marginBottom: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: T.ink, marginBottom: 3 }}>One profile, two outputs</div>
        <div style={{ color: T.sub, fontSize: 12, lineHeight: 1.55, marginBottom: 12 }}>The rich story is what you send to stand out. The clean document is what you upload when a system demands an attachment — single column, standard headings, passes any ATS.</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn full v="p">Share your story</Btn>
          <Btn full v="g">Download ATS resume</Btn>
        </div>
      </Card>

      {/* Living profile — it grows after the first build */}
      <Card sx={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: T.ink }}>Living profile</div>
          <Btn sm v="ghost">+ Add a chapter</Btn>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: T.blueDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><I n="spark" s={15} c={T.blue} /></div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 12.5, color: T.ink }}>Completed OSHA 30 certification</div>
            <div style={{ color: T.sub, fontSize: 11.5, marginTop: 2 }}>Added March 2026 · visible to companies following you</div>
          </div>
        </div>
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
function TokensPage({ balance }: any) {
  return (
    <div className="rw-fu">
      <Banner title="Tokens" sub="Your reach is finite on purpose — so it means something" />
      <Card sx={{ marginBottom: 14, background: `linear-gradient(120deg,${T.redDim},transparent)`, borderColor: T.redLn }}>
        <div className="mono" style={{ fontSize: 10, color: T.sub, letterSpacing: '.1em', marginBottom: 4 }}>BALANCE</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}><span className="disp" style={{ fontSize: 52, color: T.ink, lineHeight: 0.85 }}>{balance}</span><span style={{ color: T.sub, fontSize: 14, marginBottom: 6 }}>application tokens</span></div>
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

// ── Candidate · Intro video — a real browser recorder (getUserMedia + MediaRecorder).
// Records locally so the keyless demo works end-to-end; the production path is the mobile
// native capture → Mux pipeline (Feature 1.4, /api/intro-video). +30 strength when done. ──
const VIDEO_SCRIPT = [
  ['Who you are', '“I’m Marcus — twelve years Army, logistics. I ran a 45-person platoon.”'],
  ['One thing you’re proud of', 'A specific moment, not a job title. The day it all went wrong and you fixed it.'],
  ['What you want next', 'Forward-looking, one sentence. Where you’re headed, not just where you’ve been.'],
];

function VideoPage() {
  const [phase, setPhase] = useState<'idle' | 'live' | 'recorded' | 'saved' | 'denied'>('idle');
  const [secs, setSecs] = useState(0);
  const [clipUrl, setClipUrl] = useState<string | null>(null);
  const liveRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = () => { if (timerRef.current) clearInterval(timerRef.current); timerRef.current = null; };

  async function start() {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) { setPhase('denied'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const rec = new MediaRecorder(stream);
      recRef.current = rec;
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'video/webm' });
        setClipUrl((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(blob); });
        setPhase('recorded');
      };
      setSecs(0);
      setPhase('live');
      rec.start();
      // Attach the live stream once the <video> is in the DOM.
      requestAnimationFrame(() => {
        if (liveRef.current) { liveRef.current.srcObject = stream; liveRef.current.play().catch(() => {}); }
      });
      timerRef.current = setInterval(() => {
        setSecs((s) => {
          if (s >= 59) { stopRec(); return 60; }
          return s + 1;
        });
      }, 1000);
    } catch {
      setPhase('denied');
    }
  }

  function stopRec() {
    stopTimer();
    if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop();
  }

  function discard() {
    if (clipUrl) URL.revokeObjectURL(clipUrl);
    setClipUrl(null);
    setSecs(0);
    setPhase('idle');
  }

  useEffect(() => () => {
    stopTimer();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop();
  }, []);

  return (
    <div className="rw-fu">
      <Banner title="Intro video" sub="60 seconds. The person before the paper — employers watch this first." />

      <Card sx={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>
        <div style={{ aspectRatio: '16/9', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {phase === 'live' && (
            <>
              <video ref={liveRef} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
              <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(0,0,0,.55)', borderRadius: 99, padding: '5px 12px' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.red }} />
                <span className="mono" style={{ color: '#fff', fontSize: 12 }}>{secs}s / 60s</span>
              </div>
            </>
          )}
          {(phase === 'recorded' || phase === 'saved') && clipUrl && (
            <video src={clipUrl} controls playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          {phase === 'idle' && (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ width: 54, height: 54, borderRadius: '50%', background: T.redDim, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}><I n="play" s={22} c={T.red} /></div>
              <div style={{ color: T.sub, fontSize: 13 }}>Camera and mic stay off until you hit record.</div>
            </div>
          )}
          {phase === 'denied' && (
            <div style={{ textAlign: 'center', padding: 20, maxWidth: 340 }}>
              <div style={{ color: T.ink, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Camera unavailable</div>
              <div style={{ color: T.sub, fontSize: 12.5, lineHeight: 1.55 }}>Allow camera and microphone access in your browser, then try again. On the phone, the app uses the native camera.</div>
            </div>
          )}
        </div>
      </Card>

      {phase !== 'saved' ? (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {phase === 'live' ? (
            <Btn full v="g" onClick={stopRec}>⏹ Stop recording</Btn>
          ) : phase === 'recorded' ? (
            <>
              <Btn full v="ghost" onClick={discard}>Re-record</Btn>
              <Btn full v="flag" onClick={() => setPhase('saved')}>Use this take</Btn>
            </>
          ) : (
            <Btn full v="p" onClick={start}>⏺ Record your intro</Btn>
          )}
        </div>
      ) : (
        <div className="rw-pop" style={{ display: 'flex', alignItems: 'center', gap: 12, background: T.blueDim, border: `1px solid ${T.blueLn}`, borderRadius: 12, padding: '13px 16px', marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: T.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><I n="check" s={17} c="#fff" /></div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: T.blue }}>Your intro is live. +30 strength.</div>
            <div style={{ color: T.sub, fontSize: 12, marginTop: 2 }}>This is what a hiring manager sees first — the person, before the paper. (Demo: saved locally; the app uploads to your profile.)</div>
          </div>
        </div>
      )}

      <Card>
        <div style={{ fontWeight: 700, fontSize: 13, color: T.ink, marginBottom: 3 }}>Your script — one take is plenty</div>
        <div style={{ color: T.sub, fontSize: 12, marginBottom: 12 }}>Three beats. Don’t polish it — the unpolished version is the one that gets calls.</div>
        {VIDEO_SCRIPT.map(([t, d], i) => (
          <div key={t} style={{ display: 'flex', gap: 12, padding: '9px 0', borderBottom: i < VIDEO_SCRIPT.length - 1 ? `1px solid ${T.ln}` : 'none' }}>
            <span className="disp" style={{ fontSize: 22, color: T.red, width: 20, flexShrink: 0, lineHeight: 1.1 }}>{i + 1}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 12.5, color: T.ink }}>{t}</div>
              <div style={{ color: T.sub, fontSize: 12, lineHeight: 1.55, marginTop: 2 }}>{d}</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── Candidate · Insight — the Full Spectrum assessment agent, LIVE. A real conversation
// (never a form) that reads personality, EQ, and resilience from stories. Talks to
// /api/guest/assessment: the real Claude agent with a key, a scripted walk-through
// without one, so tonight's keyless demo completes end to end. ────────────────────────────
const INSIGHT_OPENER =
  "This part isn't a test. There are no right answers and nothing to study for — I'm just going to ask for a few real stories, because how you actually handled a real Tuesday says more than any rating scale ever could.\n\nFirst one: tell me about a time a plan fell apart on you. What did you do in the first ten minutes?";

function InsightPage() {
  const [msgs, setMsgs] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: INSIGHT_OPENER },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [reflection, setReflection] = useState<string | null>(null);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [showNarrative, setShowNarrative] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || busy || reflection) return;
    const next = [...msgs, { role: 'user' as const, content: text }];
    setMsgs(next);
    setInput('');
    setBusy(true);
    try {
      const res = await fetch('/api/guest/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });
      const d = await res.json();
      if (d.demo) setIsDemo(true);
      if (d.reply) setMsgs((m) => [...m, { role: 'assistant', content: d.reply }]);
      if (d.complete) {
        setReflection(d.reflection ?? d.reply ?? null);
        setNarrative(d.narrative ?? null);
      }
    } catch {
      setMsgs((m) => [...m, { role: 'assistant', content: 'I lost the thread for a second — say that again?' }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rw-fu">
      <Banner title="Insight" sub="Not a test — a conversation. How you think, work with people, and handle pressure." />

      <Card sx={{ padding: 0, overflow: 'hidden', marginBottom: 12 }}>
        <div style={{ maxHeight: 380, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '85%', padding: '10px 13px', borderRadius: m.role === 'user' ? '13px 13px 4px 13px' : '13px 13px 13px 4px', background: m.role === 'user' ? T.red : T.surf, border: m.role === 'user' ? 'none' : `1px solid ${T.ln}`, fontSize: 13, color: m.role === 'user' ? '#fff' : T.ink, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{m.content}</div>
            </div>
          ))}
          {busy && (
            <div style={{ display: 'flex', gap: 4, padding: '6px 4px' }}>
              {[0, 1, 2].map((k) => <div key={k} style={{ width: 6, height: 6, borderRadius: '50%', background: T.sub, animation: `rwUp 1s ease ${k * 0.15}s infinite alternate` }} />)}
            </div>
          )}
        </div>
        {!reflection && (
          <div style={{ padding: '10px 12px', borderTop: `1px solid ${T.ln}`, display: 'flex', gap: 8 }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Tell it like it happened — specifics beat polish" disabled={busy} style={{ flex: 1, background: T.surf, border: `1px solid ${T.ln2}`, borderRadius: 99, padding: '10px 16px', color: T.ink, fontSize: 13, fontFamily: 'inherit' }} />
            <button onClick={send} disabled={busy || !input.trim()} style={{ width: 40, height: 40, borderRadius: '50%', background: input.trim() && !busy ? T.red : T.ln2, border: 'none', cursor: input.trim() && !busy ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <I n="check" s={16} c="#fff" />
            </button>
          </div>
        )}
      </Card>

      {reflection && (
        <div className="rw-pop" style={{ marginBottom: 12 }}>
          <Card ac={T.blueLn} sx={{ background: `linear-gradient(120deg,${T.blueDim},transparent)` }}>
            <div className="mono" style={{ fontSize: 10, color: T.blue, letterSpacing: '.08em', marginBottom: 8 }}>YOUR REFLECTION · +25 STRENGTH</div>
            <div style={{ color: T.ink, fontSize: 13.5, lineHeight: 1.7 }}>{reflection}</div>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.ln}` }}>
              <button onClick={() => setShowNarrative((s) => !s)} style={{ background: 'none', border: 'none', color: T.sub, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                {showNarrative ? '▾' : '▸'} What the hiring manager sees
              </button>
              {showNarrative && (
                <div style={{ color: T.sub, fontSize: 12.5, lineHeight: 1.65, marginTop: 8 }}>
                  {narrative ?? 'Your Insight narrative — the 90-second read that brings you to life for an employer — is written from this conversation and lands on the company side of your profile. Open the Midland Steel context → Applicants → Marcus T. to see what one looks like.'}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {isDemo && (
        <div className="mono" style={{ fontSize: 10.5, color: T.sub, textAlign: 'center', letterSpacing: '.04em' }}>
          SCRIPTED WALK-THROUGH · ADD ANTHROPIC_API_KEY FOR THE LIVE AGENT
        </div>
      )}
    </div>
  );
}

// ── Candidate · Openings — video-first roles, applying costs a token (signal, not spam) ───
const OPENINGS = [
  { id: 'j1', co: 'Midland Steel', title: 'Senior Structural Fabricator', pay: '$28–$34/hr', place: 'Waukesha, WI', fit: 94, preview: 'The shop lead walks you through a real Tuesday — the floor, the crew, what breaks and who fixes it.' },
  { id: 'j2', co: 'Cumberland Freight', title: 'Shop Lead', pay: '$30–$36/hr', place: 'Nashville, TN', fit: 81, preview: 'Their maintenance chief shows the bay you would run and the first 90 days, honestly.' },
  { id: 'j3', co: 'Great Lakes Mfg', title: 'Fabricator II', pay: '$24–$29/hr', place: 'Columbus, OH', fit: 68, preview: 'A day on the line with the crew you would join — no stock footage.' },
  { id: 'j4', co: 'Cascade Operations', title: 'Maintenance Supervisor', pay: '$32–$38/hr', place: 'Seattle, WA', fit: 74, preview: 'The plant manager on what good looks like at 6am when a line is down.' },
];

function JobsPage({ balance, applied, onApply }: any) {
  return (
    <div className="rw-fu">
      <Banner title="Openings" sub="Video-first roles, matched to who you are — applying costs a token, so it lands as real intent" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {OPENINGS.map((j) => {
          const sent = applied.includes(j.id);
          const top = j.fit >= 90;
          return (
            <Card key={j.id} ac={top ? T.blueLn : T.ln}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Avatar name={j.co} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: T.ink }}>{j.title}</div>
                  <div style={{ color: T.sub, fontSize: 12, marginTop: 1 }}>{j.co} · {j.place} · {j.pay}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="disp" style={{ fontSize: 26, color: top ? T.blue : T.red, lineHeight: 1 }}>{j.fit}%</div>
                  <div className="mono" style={{ color: T.sub, fontSize: 9 }}>FIT</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 9, alignItems: 'center', marginTop: 10, background: T.surf, border: `1px solid ${T.ln}`, borderRadius: 9, padding: '9px 12px' }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: T.redDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><I n="play" s={13} c={T.red} /></div>
                <div style={{ color: T.sub, fontSize: 12, lineHeight: 1.5 }}>{j.preview}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
                {sent ? (
                  <div className="rw-pop" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: T.blueDim, border: `1px solid ${T.blueLn}`, borderRadius: 9, padding: '9px 12px' }}>
                    <I n="check" s={14} c={T.blue} />
                    <span style={{ color: T.blue, fontSize: 12.5, fontWeight: 700 }}>Sent — track it in Applications. You'll see every status.</span>
                  </div>
                ) : (
                  <>
                    <Btn v={top ? 'flag' : 'p'} dis={balance <= 0} onClick={() => onApply(j.id)}>Apply · 1 token</Btn>
                    <Btn v="ghost">Watch the role</Btn>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── Candidate · Applications — the black-hole killer. Every application has a visible,
// honest status trail. Even a no comes with a reason, never a void. ──────────────────────
const SEED_APPLICATIONS = [
  {
    job: 'Senior Structural Fabricator', co: 'Midland Steel', when: 'Applied 3 days ago', state: 'Interview invited', stateC: 'blue',
    steps: [
      { t: 'Application sent', d: 'Tue 9:12 AM', done: true },
      { t: 'Seen by Sarah King, HR', d: '2 hours after you applied', done: true },
      { t: 'Fit read shared with the shop foreman', d: 'Wed', done: true },
      { t: 'Interview invite — pick a time', d: 'Today', done: true, active: true },
    ],
  },
  {
    job: 'Maintenance Lead', co: 'Great Lakes Mfg', when: 'Applied 1 week ago', state: 'In review', stateC: 'red',
    steps: [
      { t: 'Application sent', d: 'Last Mon', done: true },
      { t: 'Seen by the hiring team', d: '1 day after you applied', done: true },
      { t: 'In review — 4 candidates in this round', d: 'Honest count, updated live', done: true, active: true },
      { t: 'Decision', d: 'They committed to answer within 10 days', done: false },
    ],
  },
  {
    job: 'Ops Coordinator', co: 'Titan Fabrication', when: 'Applied 2 weeks ago', state: 'Closed, with a reason', stateC: 'dim',
    steps: [
      { t: 'Application sent', d: '2 weeks ago', done: true },
      { t: 'Seen and reviewed', d: '3 days in', done: true },
      { t: 'Role filled internally. Their note: “Strong profile — we kept you visible to our team.”', d: 'A real answer, not silence', done: true, active: true },
    ],
  },
];

function ApplicationsPage({ applied }: any) {
  const dynamic = OPENINGS.filter((j) => applied.includes(j.id)).map((j) => ({
    job: j.title, co: j.co, when: 'Applied just now', state: 'Sent', stateC: 'red',
    steps: [
      { t: 'Application sent', d: 'Just now', done: true, active: true },
      { t: 'First status lands when a human sees it', d: 'You will know — always', done: false },
    ],
  }));
  const all = [...dynamic, ...SEED_APPLICATIONS];
  const stateColor = (c: string) => (c === 'blue' ? T.blue : c === 'dim' ? T.sub : T.red);
  return (
    <div className="rw-fu">
      <Banner title="Applications" sub="No black holes. Every application has a status you can see — including the no's." accent={T.blue} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {all.map((a, i) => (
          <Card key={i}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <Avatar name={a.co} size={38} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: T.ink }}>{a.job}</div>
                <div style={{ color: T.sub, fontSize: 12 }}>{a.co} · {a.when}</div>
              </div>
              <Tag c={stateColor(a.stateC)}>{a.state}</Tag>
            </div>
            <div style={{ paddingLeft: 6 }}>
              {a.steps.map((s: any, k: number) => (
                <div key={k} style={{ display: 'flex', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.active ? (a.stateC === 'blue' ? T.blue : T.red) : s.done ? T.ln2 : 'transparent', border: s.done ? 'none' : `1.5px solid ${T.ln2}`, flexShrink: 0, marginTop: 4 }} />
                    {k < a.steps.length - 1 && <div style={{ width: 1.5, flex: 1, background: T.ln2, minHeight: 18 }} />}
                  </div>
                  <div style={{ paddingBottom: k < a.steps.length - 1 ? 12 : 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: s.active ? 700 : 500, color: s.done ? T.ink : T.sub, lineHeight: 1.5 }}>{s.t}</div>
                    <div className="mono" style={{ fontSize: 10.5, color: T.sub, marginTop: 1 }}>{s.d}</div>
                  </div>
                </div>
              ))}
            </div>
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

// ── Company · Applicants — Karen's decision surface. Everything she needs to decide
// whether to invest in an interview, on one screen: the person, the proof, the honest gap. ─
const APPLICANTS = [
  {
    name: 'Marcus T.', role: 'Senior Structural Fabricator', match: 94,
    why: 'Ran a 45-person logistics floor under pressure — built to run a shop.',
    home: 'Columbus, OH', openTo: ['Milwaukee, WI', 'Nashville, TN'],
    decoded: 'Led 45 people and millions in equipment; ran daily logistics under real pressure. In business terms: a working supervisor who can own a distribution or fabrication floor from day one.',
    proofs: ['Held a Secret clearance — passed a federal background bar', '6 years without a recordable safety incident on his watch', 'Trained and certified 12 junior operators'],
    moves: [
      { role: 'Senior Fabricator, Midwest Industrial', why: 'Took the lead role to own quality end-to-end. Left in an economic layoff — not for lack of work.' },
      { role: 'Logistics Platoon Sergeant, US Army', why: 'Learned that you earn trust by showing up first and leaving last — through a deployment in extreme heat with supply delays.' },
    ],
    dims: [['Skills & experience', 92], ['Resilience & drive', 95], ['Interpersonal EQ', 84], ['Motivation & values', 90], ['Working style', 78]],
    gap: 'Lighter on CNC programming than the role ideal — everything else clears the bar with room.',
    insight: [
      "Marcus doesn't wait to be handed a broken process. When the parts inventory system at his last shop kept losing track of backordered items, he built his own tracking sheet on the side before anyone asked him to, then brought it to his supervisor already working. That instinct, to fix the thing rather than flag the thing, shows up everywhere in how he talks about his work.",
      "He's steady under pressure in a specific way: not loud, not visibly rattled, but he'll tell you plainly when a plan isn't working rather than quietly pushing through it. When a coworker was struggling to keep pace during a rush, Marcus noticed before anyone said anything and shifted his own workload to cover, then talked to the guy afterward instead of letting it become a thing. That's the pattern with him: he reads what's happening around him and acts on it without needing to be asked.",
      "He'll do best somewhere that gives him real ownership over a piece of the operation rather than a narrow lane, and where people say what they mean directly. He's not looking to be managed closely. He's looking for a problem worth solving.",
    ],
  },
  {
    name: 'Jason K.', role: 'Lead MIG Welder', match: 87,
    why: 'Deep structural welding background; strong on conscientiousness.',
    home: 'Nashville, TN', openTo: ['Waukesha, WI'],
    decoded: 'A craftsman first: a decade of structural work with inspection-grade standards. Reads as the steady core of a crew, not the loudest voice in it.',
    proofs: ['AWS D1.1 certified, current', 'Zero rework flags across last two employers'],
    moves: [{ role: 'Lead Welder, Atlas Mechanical', why: 'Moved for the harder work — wanted inspection-grade standards, not production shortcuts.' }],
    dims: [['Skills & experience', 90], ['Resilience & drive', 82], ['Interpersonal EQ', 74], ['Motivation & values', 88], ['Working style', 85]],
    gap: 'Less leadership time than the role ideal — a strong second, growing into a first.',
  },
  {
    name: 'Deon R.', role: 'CNC Machinist', match: 79,
    why: 'High drive, early in transition; would grow into the role fast.',
    home: 'Dayton, OH', openTo: ['Anywhere in the Midwest'],
    decoded: 'Early in his civilian transition with the steepest growth curve on this list. What he lacks in shop years he covers in discipline and speed of learning.',
    proofs: ['SkillBridge completion, machining track', 'Volunteered for every qualification available to him'],
    moves: [{ role: 'Machinist Mate, US Navy', why: 'Chose the rating for the craft — wanted a trade he could carry into civilian life.' }],
    dims: [['Skills & experience', 68], ['Resilience & drive', 92], ['Interpersonal EQ', 80], ['Motivation & values', 86], ['Working style', 75]],
    gap: 'Two years of shop experience against a role ideal of five — an investment hire, honestly framed.',
  },
];

function ApplicantsPage({ ctx }: any) {
  const [sel, setSel] = useState<number | null>(null);
  if (sel !== null) {
    const a = APPLICANTS[sel];
    const top = a.match >= 90;
    return (
      <div className="rw-fu">
        <button onClick={() => setSel(null)} style={{ background: 'none', border: 'none', color: T.sub, fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 14, fontFamily: 'inherit' }}>‹ All applicants</button>
        <Card sx={{ marginBottom: 10 }} ac={top ? T.blueLn : T.ln}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <Avatar name={a.name} size={52} self />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: T.ink }}>{a.name}</div>
              <div style={{ color: T.sub, fontSize: 12.5, marginTop: 2 }}>Applying: {a.role}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                <Tag c={T.red}>★ {a.home}</Tag>
                {a.openTo.map((o) => <Tag key={o} c={T.blue}>Open to {o}</Tag>)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="disp" style={{ fontSize: 38, color: top ? T.blue : T.red, lineHeight: 1 }}>{a.match}%</div>
              <div className="mono" style={{ color: T.sub, fontSize: 9 }}>{top ? 'EXCEPTIONAL FIT' : 'FIT'}</div>
            </div>
          </div>
        </Card>
        <Card sx={{ marginBottom: 10, display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }}>
          <div style={{ width: 44, height: 44, borderRadius: 11, background: T.redDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><I n="play" s={19} c={T.red} /></div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: T.ink }}>60-second intro</div>
            <div style={{ color: T.sub, fontSize: 12 }}>The person before the paper — watch before you read.</div>
          </div>
        </Card>
        <Card sx={{ marginBottom: 10 }}>
          <div className="mono" style={{ fontSize: 10, color: T.red, letterSpacing: '.08em', marginBottom: 8 }}>DECODED — WHAT THE SERVICE RECORD MEANS FOR YOUR FLOOR</div>
          <div style={{ color: T.ink, fontSize: 13, lineHeight: 1.65 }}>{a.decoded}</div>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {a.proofs.map((pf) => (
              <div key={pf} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <I n="check" s={13} c={T.blue} />
                <span style={{ color: T.sub, fontSize: 12.5, lineHeight: 1.5 }}>{pf}</span>
              </div>
            ))}
          </div>
        </Card>
        {a.insight && (
          <Card sx={{ marginBottom: 10 }} ac={T.blueLn}>
            <div className="mono" style={{ fontSize: 10, color: T.blue, letterSpacing: '.08em', marginBottom: 8 }}>INSIGHT · HOW HE OPERATES — A 90-SECOND READ</div>
            {a.insight.map((para: string, k: number) => (
              <p key={k} style={{ color: T.ink, fontSize: 13, lineHeight: 1.7, margin: k === 0 ? 0 : '10px 0 0' }}>{para}</p>
            ))}
            <div style={{ color: T.sub, fontSize: 11.5, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.ln}` }}>Written by the Full Spectrum agent from his own words — not a trait checklist.</div>
          </Card>
        )}
        <Card sx={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: T.ink, marginBottom: 10 }}>The why behind each move — what a resume erases</div>
          {a.moves.map((m, k) => (
            <div key={k} style={{ padding: '8px 0', borderBottom: k < a.moves.length - 1 ? `1px solid ${T.ln}` : 'none' }}>
              <div style={{ fontWeight: 600, fontSize: 12.5, color: T.ink }}>{m.role}</div>
              <div style={{ color: T.sub, fontSize: 12.5, lineHeight: 1.6, marginTop: 4, paddingLeft: 10, borderLeft: `2px solid ${T.redLn}` }}>{m.why}</div>
            </div>
          ))}
        </Card>
        <Card sx={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: T.ink, marginBottom: 12 }}>Fit, dimension by dimension</div>
          {a.dims.map(([l, v]: any) => (
            <div key={l} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}><span style={{ color: T.ink }}>{l}</span><span className="mono" style={{ color: v >= 90 ? T.blue : T.red }}>{v}</span></div>
              <Bar val={v} c={v >= 90 ? T.blue : T.red} />
            </div>
          ))}
          <div style={{ color: T.sub, fontSize: 12.5, lineHeight: 1.6, marginTop: 6 }}><span style={{ fontWeight: 700 }}>The honest gap: </span>{a.gap}</div>
        </Card>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn full v={top ? 'flag' : 'p'}>Invite to interview · 1 token</Btn>
          <Btn full v="g">Message {a.name.split(' ')[0]}</Btn>
        </div>
      </div>
    );
  }
  return (
    <div className="rw-fu">
      <Banner title="Applicants" sub={`${ctx.companyName} · sorted by fit — open one to see the whole person`} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {APPLICANTS.map((a, i) => (
          <Card key={i} sx={{ cursor: 'pointer' }}>
            <div onClick={() => setSel(i)} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Avatar name={a.name} size={40} />
              <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 13, color: T.ink }}>{a.name}</div><div style={{ color: T.sub, fontSize: 12 }}>{a.role}</div></div>
              <div style={{ textAlign: 'right' }}>
                <div className="disp" style={{ fontSize: 28, color: a.match > 90 ? T.blue : T.red, lineHeight: 1 }}>{a.match}%</div>
                <div className="mono" style={{ color: T.sub, fontSize: 9 }}>FIT</div>
              </div>
              <span style={{ color: T.sub, fontSize: 18 }}>›</span>
            </div>
            <div style={{ color: T.ink, fontSize: 12.5, lineHeight: 1.6, marginTop: 10, paddingLeft: 10, borderLeft: `2px solid ${a.match > 90 ? T.blueLn : T.redLn}` }}>{a.why}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Company · Source — "Come Home." Find people FROM a place, OPEN TO a place, or either —
// then reach out directly. The two location fields, working separately, as promised. ──────
const SOURCE_POOL = [
  { name: 'Marcus T.', headline: 'Ops leader who ran a 45-person logistics platoon', home: 'Columbus, OH', roots: ['Columbus, OH', 'Lancaster, OH'], openTo: ['Milwaukee, WI', 'Nashville, TN', 'Anywhere in the Midwest'], strength: 90 },
  { name: 'Carla V.', headline: 'Quality-first fabricator, 12 years on structural steel', home: 'Milwaukee, WI', roots: ['Milwaukee, WI'], openTo: ['Madison, WI'], strength: 84 },
  { name: 'Deon R.', headline: 'CNC machinist, early in his transition, steep growth curve', home: 'Dayton, OH', roots: ['Dayton, OH'], openTo: ['Anywhere in the Midwest', 'Milwaukee, WI'], strength: 67 },
  { name: 'Jason K.', headline: 'Lead welder with inspection-grade standards', home: 'Nashville, TN', roots: ['Nashville, TN'], openTo: [], strength: 78 },
];

function SourcePage({ ctx }: any) {
  const [place, setPlace] = useState('Milwaukee');
  const [scope, setScope] = useState<'hometown' | 'open_to' | 'either'>('either');
  const [invited, setInvited] = useState<string[]>([]);
  const p = place.trim().toLowerCase();
  const results = SOURCE_POOL.map((c) => {
    const byHome = !!p && (c.home.toLowerCase().includes(p) || c.roots.some((r) => r.toLowerCase().includes(p)));
    const byOpen = !!p && c.openTo.some((o) => o.toLowerCase().includes(p));
    return { c, byHome, byOpen };
  }).filter((r) => !p || (scope === 'hometown' ? r.byHome : scope === 'open_to' ? r.byOpen : r.byHome || r.byOpen));
  const scopes: [typeof scope, string][] = [['hometown', 'From here (Come Home)'], ['open_to', 'Would move here'], ['either', 'Either']];
  return (
    <div className="rw-fu">
      <Banner title="Source people" sub={`${ctx.companyName} · find talent with roots in your region, or willing to come`} />
      <Card sx={{ marginBottom: 12 }}>
        <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Search a place — city, state, or region" style={{ width: '100%', background: T.surf, border: `1px solid ${T.ln2}`, borderRadius: 9, padding: '11px 14px', color: T.ink, fontSize: 14, fontFamily: 'inherit', marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {scopes.map(([k, l]) => (
            <button key={k} onClick={() => setScope(k)} style={{ padding: '6px 13px', borderRadius: 99, background: scope === k ? T.red : 'transparent', border: `1px solid ${scope === k ? T.red : T.ln2}`, color: scope === k ? '#fff' : T.sub, fontSize: 12, fontWeight: scope === k ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit' }}>{l}</button>
          ))}
        </div>
      </Card>
      {results.length === 0 ? (
        <Card sx={{ textAlign: 'center', padding: '30px 20px' }}><div style={{ color: T.sub, fontSize: 13 }}>No one matches that place and filter yet — new people land here as they join.</div></Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {results.map(({ c, byHome, byOpen }) => {
            const sent = invited.includes(c.name);
            return (
              <Card key={c.name}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Avatar name={c.name} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: T.ink }}>{c.name}</div>
                    <div style={{ color: T.sub, fontSize: 12, lineHeight: 1.5, marginTop: 1 }}>{c.headline}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="disp" style={{ fontSize: 24, color: T.ink, lineHeight: 1 }}>{c.strength}</div>
                    <div className="mono" style={{ color: T.sub, fontSize: 8.5 }}>STRENGTH</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  {byHome && p ? <Tag c={T.red}>★ Come Home — {c.home}</Tag> : <Tag c={T.sub}>★ {c.home}</Tag>}
                  {byOpen && p && <Tag c={T.blue}>Open to moving here</Tag>}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  {sent ? (
                    <div className="rw-pop" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: T.blueDim, border: `1px solid ${T.blueLn}`, borderRadius: 9, padding: '8px 12px' }}>
                      <I n="check" s={13} c={T.blue} /><span style={{ color: T.blue, fontSize: 12, fontWeight: 700 }}>Invite sent — they see who you are and why you reached out.</span>
                    </div>
                  ) : (
                    <>
                      <Btn sm v="p" onClick={() => setInvited((xs) => [...xs, c.name])}>Invite · 1 token</Btn>
                      <Btn sm v="ghost">View story</Btn>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
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
  // Shared candidate state: applying from Openings spends a token and shows up in the
  // Applications tracker immediately — the loop, closed, in one shell.
  const [appTokens, setAppTokens] = useState(11);
  const [applied, setApplied] = useState<string[]>([]);
  const applyToJob = (id: string) => {
    if (appTokens <= 0 || applied.includes(id)) return;
    setAppTokens((t) => t - 1);
    setApplied((xs) => [...xs, id]);
  };

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
      if (id === 'video') return <VideoPage />;
      if (id === 'insight') return <InsightPage />;
      if (id === 'strength') return <StrengthPage />;
      if (id === 'jobs') return <JobsPage balance={appTokens} applied={applied} onApply={applyToJob} />;
      if (id === 'applications') return <ApplicationsPage applied={applied} />;
      if (id === 'fit') return <FitReadsPage />;
      if (id === 'places') return <PlacesPage />;
      if (id === 'messages') return <SimpleMessages />;
      if (id === 'tokens') return <TokensPage balance={appTokens} />;
    } else {
      if (id === 'dashboard') return <DashboardPage ctx={ctx} />;
      if (id === 'source') return <SourcePage ctx={ctx} />;
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
