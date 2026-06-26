// Public job-board types + sample listings.
//
// Anyone can browse jobs without an account or a profile (the vision: "a place you can
// wander freely before you ever sign up"; job/company stories are public like YouTube).
// DEMO_JOBS render when no database is connected (preview mode) so the browse experience
// is visible immediately; with a DB, real published roles replace them.

export interface PublicJob {
  id: string;
  title: string;
  company: string;
  location: string | null;
  blurb: string; // short teaser for the card
  description: string; // full role description
  videoUrl: string | null; // video-first when present
  demo?: boolean;
}

export const DEMO_JOBS: PublicJob[] = [
  {
    id: 'demo-ops-lead',
    title: 'Regional Operations Lead',
    company: 'Ridgeline Logistics',
    location: 'Columbus, OH',
    blurb:
      'Run the floor for a fast-growing distribution hub. Built for someone who has led people under pressure and keeps a cool head when it counts.',
    description:
      "You'll own daily operations for a 60-person distribution hub — staffing, safety, throughput, and the people who make it run. We care less about your degree and more about whether you've led a team through a hard day and come out the other side. Veterans thrive here: the work rewards ownership, calm under pressure, and taking care of your people. Real growth path to site director.",
    videoUrl: null,
    demo: true,
  },
  {
    id: 'demo-field-tech',
    title: 'Field Service Technician',
    company: 'Summit Energy',
    location: 'Remote / regional travel',
    blurb:
      'Hands-on problem solving in the field. If you like fixing real things and working independently, this is your lane.',
    description:
      'Install, troubleshoot, and maintain energy systems across a regional territory. You set your route, you solve the problem, you move on. Strong fit for anyone who ran maintenance or technical operations in service — we translate that experience and we train the rest. Company vehicle, tools, and certifications provided.',
    videoUrl: null,
    demo: true,
  },
  {
    id: 'demo-csm',
    title: 'Customer Success Manager',
    company: 'Beacon Health',
    location: 'Austin, TX (hybrid)',
    blurb:
      'Be the person customers trust. Built for strong communicators who lead with empathy and follow through.',
    description:
      "You'll own a book of healthcare customers — onboarding them, earning their trust, and making sure they get real value. The best people in this role read a room, stay organized, and do what they say they'll do. No sales background required; we've found people who led others and cared about the mission pick this up fast.",
    videoUrl: null,
    demo: true,
  },
];
