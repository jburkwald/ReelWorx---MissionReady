import { auth, currentUser } from '@clerk/nextjs/server';
import { getPlaces, prisma, setPlaces, syncUser } from '@reelworx/shared/server';
import type { LocationRef } from '@reelworx/shared';
import { NextResponse } from 'next/server';

// Hometown + Open To, the two DISTINCT location fields (see the schema's Root.kind).
// The candidate edits them from the profile review screen; autocomplete itself is
// isomorphic (suggestLocations in @reelworx/shared), so the client needs no suggest call.
//   GET                                  → { hometown, openTo, roots }
//   POST { hometown?, openTo? }          → set either or both; omit a field to leave it
//                                          unchanged, send '' / [] to clear it
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
    return NextResponse.json(await getPlaces(prisma, uid));
  } catch (err) {
    return NextResponse.json({ error: 'Places unavailable', detail: String(err) }, { status: 503 });
  }
}

export async function POST(req: Request) {
  let body: { hometown?: unknown; openTo?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // hometown: a string (or '' to clear), or omitted to leave unchanged.
  const hometown =
    typeof body.hometown === 'string' ? body.hometown : body.hometown === null ? null : undefined;

  // openTo: an array of strings or {label, kind} objects, or omitted to leave unchanged.
  let openTo: Array<LocationRef | string> | undefined;
  if (Array.isArray(body.openTo)) {
    openTo = body.openTo
      .map((v) =>
        typeof v === 'string'
          ? v
          : v && typeof v === 'object' && typeof (v as { label?: unknown }).label === 'string'
            ? ({ label: (v as { label: string }).label, kind: (v as LocationRef).kind ?? 'metro' } as LocationRef)
            : null,
      )
      .filter((v): v is LocationRef | string => v !== null);
  }

  if (hometown === undefined && openTo === undefined) {
    return NextResponse.json({ error: 'hometown or openTo required' }, { status: 400 });
  }

  try {
    const uid = await candidateId();
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json(
      await setPlaces(prisma, {
        userId: uid,
        ...(hometown !== undefined ? { hometown } : {}),
        ...(openTo !== undefined ? { openTo } : {}),
      }),
    );
  } catch (err) {
    return NextResponse.json({ error: 'Places service unavailable', detail: String(err) }, { status: 503 });
  }
}
