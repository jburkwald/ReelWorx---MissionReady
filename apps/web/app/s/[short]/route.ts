import { prisma, recordShareClick } from '@reelworx/shared/server';
import { NextResponse } from 'next/server';

// The trackable hop (Feature 4.2). Public by design: a shared link logs the click that
// starts the attribution chain, then forwards to the landing. Never throws the visitor an
// error — an unknown or unlogged link still lands them somewhere sensible.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ short: string }> },
) {
  const { short } = await params;
  try {
    await recordShareClick(prisma, short);
  } catch {
    /* tracking is best-effort — never block the visitor on it */
  }
  return NextResponse.redirect(new URL(`/share/${short}`, req.url));
}
