import { runAssessmentTurn } from '@reelworx/shared/server';
import type { StoryMessage } from '@reelworx/shared';
import { NextResponse } from 'next/server';
import { checkRate } from '../../../../lib/rateLimit';

// GUEST assessment endpoint — no auth, no DB, nothing persisted. With ANTHROPIC_API_KEY
// it's the real Full Spectrum agent; without it, a scripted sequence (built from the
// agent's own question bank) keeps the keyless preview walkable end to end, finishing
// with a clearly-labeled sample reflection.
const FALLBACK_QUESTIONS = [
  "That tells me more than any rating scale would. Next one: who's someone you've worked with that you had to adjust your whole approach for? What tipped you off that you needed to?",
  "Good — that's exactly the kind of thing I'm listening for. What's something you finished that you almost didn't? What kept you going on the day you almost didn't?",
  "Last one, and honest beats polished: when's the last time you were genuinely frustrated at work? What did you actually do — not what you wish you'd done?",
];

const DEMO_REFLECTION =
  "Here's what stood out. When things break, you move — you don't wait for permission to start fixing. You notice people before they ask for help, and the things you finish, you finish because quitting would bother you more than the work does. You don't need to be managed closely; you need a problem worth solving and the room to solve it. (This is a sample reflection — the live agent writes yours from your actual words.)";

export async function POST(req: Request) {
  const limited = checkRate(req, 'guest-assessment', 40);
  if (limited) return limited;

  let body: { messages?: StoryMessage[] };
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
    const { reply, read } = await runAssessmentTurn(messages);
    return NextResponse.json({
      reply,
      complete: Boolean(read?.complete),
      reflection: read?.complete ? read.candidateReflection ?? null : null,
      narrative: read?.complete ? read.hiringManagerNarrative ?? null : null,
    });
  } catch {
    // No ANTHROPIC_API_KEY — scripted walk-through so the preview completes keyless.
    const userTurns = messages.filter((m) => m.role === 'user').length;
    if (userTurns <= FALLBACK_QUESTIONS.length) {
      return NextResponse.json({ reply: FALLBACK_QUESTIONS[userTurns - 1], demo: true });
    }
    return NextResponse.json({
      reply: DEMO_REFLECTION,
      complete: true,
      reflection: DEMO_REFLECTION,
      narrative: null,
      demo: true,
    });
  }
}
