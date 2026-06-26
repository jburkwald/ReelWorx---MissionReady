// Path Discovery (Feature 2.1) — sample suggestions for the guest/preview experience.
//
// For Marcus, who doesn't yet know who he becomes next: careers cross-wired from who he
// is, each with a plain "why this fits" and the honest gap + how to close it. With real
// data + an Anthropic key these are generated; DEMO_PATHS render in preview.

export interface CareerPath {
  id: string;
  title: string;
  sector: string;
  fitScore: number; // 0-100
  whyThisFits: string; // shown at a moderate level of reasoning
  gap: string | null; // what's missing
  bridge: string | null; // how to close it (SkillBridge / cert / training)
}

export const DEMO_PATHS: CareerPath[] = [
  {
    id: 'path-sales-engineer',
    title: 'Sales Engineer',
    sector: 'Technology',
    fitScore: 88,
    whyThisFits:
      "You combine real technical depth with something rarer — people trust you and you can explain hard things simply. That mix is exactly what makes a great sales engineer, and most people never connect those two strengths in themselves.",
    gap: 'No commercial/sales track record yet',
    bridge: 'A short B2B sales fundamentals course — many are free, and your technical credibility does the heavy lifting.',
  },
  {
    id: 'path-ops-manager',
    title: 'Operations Manager',
    sector: 'Logistics & Manufacturing',
    fitScore: 92,
    whyThisFits:
      "You've led people through hard days and kept a unit running under pressure. Civilian operations leaders are paid for exactly that — accountability, calm, and taking care of your people. This is one of the most natural translations of your service.",
    gap: null,
    bridge: null,
  },
  {
    id: 'path-cybersecurity',
    title: 'Cybersecurity Analyst',
    sector: 'Information Security',
    fitScore: 85,
    whyThisFits:
      'Discipline, attention to detail, and comfort with high-stakes vigilance map directly onto security work — and a clearance is a serious head start most candidates don’t have.',
    gap: 'Security+ certification',
    bridge: 'CompTIA Security+ — often covered by VA/SkillBridge funding, ~8–12 weeks of study.',
  },
  {
    id: 'path-project-manager',
    title: 'Project Manager',
    sector: 'Cross-industry',
    fitScore: 84,
    whyThisFits:
      'Coordinating people, timelines, and resources toward a mission is what you already did. PMs do the same thing in business language — and your bias for execution stands out.',
    gap: 'PMP or CAPM credential',
    bridge: 'CAPM to start (no experience hours required), then PMP as you log project time.',
  },
];
