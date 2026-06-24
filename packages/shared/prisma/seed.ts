// Demo candidate seed — gives the company-side Fit Read something real to rank on a fresh
// deploy. Idempotent (upsert by a stable seed authId), so it's safe to re-run.
//
// Each candidate carries a FULL five-dimension fitProfile (so scoreFit produces meaningful,
// varied scores) and a cached decodedCredibility (so match cards show a decoded read even
// before any AI key is set). Run with: npm run db:seed  (needs DATABASE_URL).

import 'dotenv/config';
import { prisma, Prisma } from '../src/server/db';

interface Demo {
  slug: string;
  email: string;
  hometown: string;
  currentLocation: string;
  headline: string;
  personality: { extraversion: number; conscientiousness: number; openness: number; agreeableness: number; emotionalStability: number };
  grit: number;
  ei: { selfAwareness: number; empathy: number; interpersonalSkill: number };
  skills: string[];
  civilian: string[];
  values: string[];
  whatDrives: string;
  summary: string;
  proof: string[];
  valuesFit: string;
  completeness: number;
  roots: { place: string; isPrimary?: boolean }[];
}

const DEMOS: Demo[] = [
  {
    slug: 'marcus',
    email: 'demo.marcus@reelworx.local',
    hometown: 'Columbus, OH',
    currentLocation: 'Columbus, OH',
    headline: 'Army logistics NCO moving into civilian operations leadership',
    personality: { extraversion: 58, conscientiousness: 92, openness: 64, agreeableness: 70, emotionalStability: 84 },
    grit: 90,
    ei: { selfAwareness: 78, empathy: 72, interpersonalSkill: 80 },
    skills: ['supply chain', 'team leadership', 'inventory accountability', 'process improvement'],
    civilian: ['Operations Manager', 'Logistics Coordinator'],
    values: ['accountability', 'service', 'discipline'],
    whatDrives: 'Keeping a team and its mission running with nothing dropped.',
    summary: 'Led a 40-person logistics section accountable for several million dollars of equipment with zero loss; promoted ahead of peers for dependable execution under pressure.',
    proof: ['Led 40 people', 'Accountable for millions in equipment', 'Advanced ahead of peers'],
    valuesFit: 'Driven by accountability and keeping the mission moving — thrives where reliability is the job.',
    completeness: 86,
    roots: [{ place: 'Columbus, OH', isPrimary: true }, { place: 'Dayton, OH' }],
  },
  {
    slug: 'dana',
    email: 'demo.dana@reelworx.local',
    hometown: 'Austin, TX',
    currentLocation: 'Dallas, TX',
    headline: 'Veteran recruiter and connector who reads people fast',
    personality: { extraversion: 90, conscientiousness: 72, openness: 76, agreeableness: 82, emotionalStability: 75 },
    grit: 80,
    ei: { selfAwareness: 85, empathy: 90, interpersonalSkill: 92 },
    skills: ['recruiting', 'relationship building', 'communication', 'coaching'],
    civilian: ['Sales Representative', 'Talent Recruiter', 'Account Manager'],
    values: ['relationships', 'growth', 'honesty'],
    whatDrives: 'Helping people find the place they actually belong.',
    summary: 'Ran unit recruiting and retention, building trust quickly with people from every background; a natural at turning a first conversation into a lasting working relationship.',
    proof: ['Led recruiting + retention', 'Built trust across diverse teams', 'Top-rated communicator'],
    valuesFit: 'Energized by people and relationships — a fit for sales, recruiting, or any front-line, human-first role.',
    completeness: 81,
    roots: [{ place: 'Austin, TX', isPrimary: true }],
  },
  {
    slug: 'ray',
    email: 'demo.ray@reelworx.local',
    hometown: 'Detroit, MI',
    currentLocation: 'Detroit, MI',
    headline: 'Avionics technician — precision diagnostics and reliability',
    personality: { extraversion: 38, conscientiousness: 94, openness: 80, agreeableness: 66, emotionalStability: 82 },
    grit: 86,
    ei: { selfAwareness: 74, empathy: 60, interpersonalSkill: 58 },
    skills: ['electronics troubleshooting', 'systems diagnostics', 'preventive maintenance', 'technical documentation'],
    civilian: ['Field Service Technician', 'Reliability Engineer', 'Maintenance Lead'],
    values: ['precision', 'mastery', 'integrity'],
    whatDrives: 'Getting it exactly right when failure is not an option.',
    summary: 'Diagnosed and repaired complex avionics under tight timelines where an error grounds an aircraft; trusted with the hardest faults nobody else could trace.',
    proof: ['Owned mission-critical diagnostics', 'Trusted with the hardest faults', 'Zero-defect documentation record'],
    valuesFit: 'Driven by precision and mastery — a fit for technical, high-stakes, detail-owned work.',
    completeness: 78,
    roots: [{ place: 'Detroit, MI', isPrimary: true }, { place: 'Toledo, OH' }],
  },
  {
    slug: 'sofia',
    email: 'demo.sofia@reelworx.local',
    hometown: 'San Diego, CA',
    currentLocation: 'Phoenix, AZ',
    headline: 'Corpsman and frontline team leader, calm in a crisis',
    personality: { extraversion: 66, conscientiousness: 84, openness: 70, agreeableness: 88, emotionalStability: 90 },
    grit: 94,
    ei: { selfAwareness: 88, empathy: 92, interpersonalSkill: 84 },
    skills: ['emergency response', 'team leadership', 'training', 'decision-making under pressure'],
    civilian: ['Operations Supervisor', 'EHS Specialist', 'Healthcare Coordinator'],
    values: ['care', 'courage', 'teamwork'],
    whatDrives: 'Taking care of the people next to me when it counts most.',
    summary: 'Led a medical team in high-pressure field conditions, making fast calls that kept people safe and training others to do the same; steady when everyone else is rattled.',
    proof: ['Led a field medical team', 'Made high-stakes calls under pressure', 'Trained and mentored peers'],
    valuesFit: 'Anchored by care and composure under pressure — a fit for operations, safety, or people-leadership roles.',
    completeness: 88,
    roots: [{ place: 'San Diego, CA', isPrimary: true }],
  },
  {
    slug: 'theo',
    email: 'demo.theo@reelworx.local',
    hometown: 'Columbus, OH',
    currentLocation: 'Remote',
    headline: 'Intelligence analyst turned data-driven problem solver',
    personality: { extraversion: 46, conscientiousness: 88, openness: 92, agreeableness: 68, emotionalStability: 80 },
    grit: 82,
    ei: { selfAwareness: 80, empathy: 66, interpersonalSkill: 64 },
    skills: ['data analysis', 'research', 'briefing', 'pattern recognition'],
    civilian: ['Data Analyst', 'Business Analyst', 'Operations Researcher'],
    values: ['truth', 'curiosity', 'rigor'],
    whatDrives: 'Finding the signal everyone else missed.',
    summary: 'Synthesized messy, high-volume information into clear assessments leaders acted on; equally comfortable in the weeds of the data and briefing the decision-maker.',
    proof: ['Briefed senior decision-makers', 'Turned raw data into action', 'Recognized for analytic rigor'],
    valuesFit: 'Driven by curiosity and rigor — a fit for analytics, research, and strategy roles.',
    completeness: 79,
    roots: [{ place: 'Columbus, OH', isPrimary: true }],
  },
];

async function main() {
  for (const d of DEMOS) {
    const authId = `seed_${d.slug}`;

    const fitProfile = {
      skillsExperience: { translatedSkills: d.skills, civilianEquivalents: d.civilian },
      personality: d.personality,
      resilienceDrive: { gritScore: d.grit },
      emotionalIntelligence: d.ei,
      motivationValues: { coreValues: d.values, whatDrivesThem: d.whatDrives },
    } as Prisma.InputJsonValue;

    const decodedCredibility = {
      headline: d.headline,
      businessSummary: d.summary,
      proofSignals: d.proof,
      valuesFit: d.valuesFit,
    } as Prisma.InputJsonValue;

    const user = await prisma.user.upsert({
      where: { authId },
      update: { email: d.email, hometown: d.hometown, currentLocation: d.currentLocation },
      create: {
        authId,
        email: d.email,
        role: 'candidate',
        hometown: d.hometown,
        currentLocation: d.currentLocation,
      },
    });

    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        headline: d.headline,
        fitProfile,
        mosTranslation: d.summary,
        decodedCredibility,
        completenessScore: d.completeness,
        visibility: 'companies_only',
      },
      create: {
        userId: user.id,
        headline: d.headline,
        fitProfile,
        mosTranslation: d.summary,
        decodedCredibility,
        completenessScore: d.completeness,
        visibility: 'companies_only',
      },
    });

    // Replace roots so re-running stays clean.
    await prisma.root.deleteMany({ where: { profileId: profile.id } });
    await prisma.root.createMany({
      data: d.roots.map((r) => ({
        profileId: profile.id,
        place: r.place,
        isPrimary: Boolean(r.isPrimary),
      })),
    });

    console.log(`seeded candidate: ${d.slug} (${d.hometown})`);
  }
  console.log(`\nDone — ${DEMOS.length} demo candidates ready for the Fit Read.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
