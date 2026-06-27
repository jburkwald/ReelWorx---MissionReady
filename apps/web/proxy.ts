import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Company-side protected surfaces. Everything else (the public planted-flag home,
// company/job stories later) stays open — exploration is free by design.
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);

// Keyless demo mode: with no DATABASE_URL the app runs without Clerk auth so the full
// company experience is testable in a browser. Auth is enforced only once a real backend
// is configured (DATABASE_URL + Clerk keys) — see lib/db-user.ts and shared/server/demo.ts.
const dbConfigured = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim());

export default clerkMiddleware(async (auth, req) => {
  if (dbConfigured && isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next internals and static files unless found in search params.
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes.
    '/(api|trpc)(.*)',
  ],
};
