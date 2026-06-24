// Self-Serve Story Studio themes (Feature 5.1) — isomorphic.
//
// "Assembly, not generation." The studio is reliable because it assembles from a LOCKED
// set of themes — the brand is always the creative director, and generative AI only fills
// the variable slot (the hook/caption). A small, fixed launch set, honestly labeled beta.
// Each theme maps to a spectrum accent so the gallery reads as ReelWorx, not a template farm.

export interface StoryTheme {
  id: string;
  name: string;
  tagline: string;
  /** What the company drops in — keeps expectations honest at the assembly step. */
  bestFor: string;
  accent: 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'indigo' | 'violet';
}

export const STORY_THEMES: StoryTheme[] = [
  { id: 'day-in-the-life', name: 'A Day in the Life', tagline: 'Show the real work, start to finish.', bestFor: 'on-site footage of the actual job', accent: 'blue' },
  { id: 'why-we-hire-vets', name: 'Why We Hire Vets', tagline: 'Your planted flag, in your own words.', bestFor: 'a leader on camera, or your site URL', accent: 'red' },
  { id: 'meet-the-team', name: 'Meet the Team', tagline: 'The people they’d actually work with.', bestFor: 'a few short team clips', accent: 'green' },
  { id: 'the-mission', name: 'The Mission', tagline: 'What you’re building and why it matters.', bestFor: 'a company-story video or web link', accent: 'violet' },
  { id: 'from-service-to-here', name: 'From Service to Here', tagline: 'A veteran on your team, telling it straight.', bestFor: 'a placed veteran’s testimonial', accent: 'orange' },
  { id: 'behind-the-work', name: 'Behind the Work', tagline: 'The craft and pride up close.', bestFor: 'b-roll of the work itself', accent: 'indigo' },
];

export function getStoryTheme(id: string): StoryTheme | undefined {
  return STORY_THEMES.find((t) => t.id === id);
}
