import { auth, currentUser } from '@clerk/nextjs/server';
import {
  decidePathSuggestion,
  generatePathSuggestions,
  listPathSuggestions,
  prisma,
  syncUser,
  type PathDecision,
} from '@reelworx/shared/server';
import { NextResponse } from 'next/server';

// Path Discovery (Feature 2.1) — driven by the MOBILE candidate app.
//   GET                                  → current live paths (saved + open suggestions)
//   POST { action: 'discover' }          → generate fresh suggestions
//   POST { action: 'decide', id, decision } → save / reject (a reject sharpens the next)
async function candidateId(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const cu = await currentUser();
  const email =
    cu?.primaryEmailAddress?.emailAddress ??
    cu?.emailAddresses[0]?.emailAddress ??
    `${userId}@placeholder.local`;
  const user = await syncUser(prisma, { authId: userId, email, role: 'candidate' });
  return user.id;
}

export async function GET() {
  try {
    const uid = await candidateId();
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const paths = await listPathSuggestions(prisma, uid);
    return NextResponse.json({ paths });
  } catch (err) {
    return NextResponse.json({ error: 'Paths unavailable', detail: String(err) }, { status: 503 });
  }
}

export async function POST(req: Request) {
  let body: { action?: string; id?: string; decision?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    const uid = await candidateId();
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (body.action === 'discover') {
      const paths = await generatePathSuggestions(prisma, { userId: uid });
      return NextResponse.json({ paths });
    }

    if (body.action === 'decide') {
      if (!body.id || (body.decision !== 'saved' && body.decision !== 'rejected')) {
        return NextResponse.json({ error: 'id and decision required' }, { status: 400 });
      }
      const paths = await decidePathSuggestion(prisma, {
        userId: uid,
        suggestionId: body.id,
        decision: body.decision as PathDecision,
      });
      return NextResponse.json({ paths });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: 'Paths service unavailable', detail: String(err) }, { status: 503 });
  }
}
