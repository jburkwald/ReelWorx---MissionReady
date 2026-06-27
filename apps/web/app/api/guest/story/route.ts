import { runStoryTurn } from '@reelworx/shared/server';
import { VOICE_AGENT, type StoryMessage } from '@reelworx/shared';
import { NextResponse } from 'next/server';

// GUEST story endpoint — no auth, no DB. Lets anyone experience the Story Profile agent
// (the heart of the candidate journey) without signing up. With ANTHROPIC_API_KEY it's
// the real emotionally-aware agent; without it, a warm scripted fallback keeps the
// preview alive. Nothing is persisted here — guest exploration only.
const FALLBACK_REPLIES = [
  "That means a lot — thank you for telling me. What part of that work did you actually like? Not what looked good on paper, what felt right.",
  "I hear you. When things got hard, what did the people around you come to you for?",
  "That’s a real strength, even if no one ever wrote it on a review. What’s something you’re quietly proud of?",
  "Okay — that helps me see you. If your next thing could feel like that at its best, what would it have in it?",
  "You’re giving me a clear picture. We can keep going, or pause here and pick up anytime — your call.",
];

export async function POST(req: Request) {
  let body: { messages?: StoryMessage[]; voice?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages required' }, { status: 400 });
  }

  try {
    // Voice mode shapes the WORDS for the ear (short, one question, no markdown).
    const { reply, extraction } = await runStoryTurn(
      messages,
      body.voice ? { systemAddendum: VOICE_AGENT.spokenStyleAddendum } : undefined,
    );
    return NextResponse.json({ reply, extraction });
  } catch {
    // No ANTHROPIC_API_KEY (or the call failed) — fall back to a scripted guide so the
    // experience is still walkable in preview.
    const userTurns = messages.filter((m) => m.role === 'user').length;
    const reply =
      FALLBACK_REPLIES[Math.min(userTurns - 1, FALLBACK_REPLIES.length - 1)] ??
      FALLBACK_REPLIES[FALLBACK_REPLIES.length - 1];
    return NextResponse.json({ reply, demo: true });
  }
}
