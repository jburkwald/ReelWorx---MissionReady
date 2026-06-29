import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { clerkEnabled } from './lib/clerk';

// Company-side protected surfaces. Everything else (the public planted-flag home,
// the candidate experience, company/job stories) stays open — exploration is free by design.
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);

// Auth is enforced only once a real backend is configured (DATABASE_URL + Clerk keys) —
// see lib/db-user.ts and shared/server/demo.ts.
const dbConfigured = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim());

const withClerk = clerkMiddleware(async (auth, req) => {
  if (dbConfigured && isProtectedRoute(req)) {
    await auth.protect();
  }
});

// Keyless demo mode (incl. a deployed preview with no keys): Clerk's keyless mode is
// dev-only, so running clerkMiddleware without a publishable key 500s every request in
// production. When Clerk isn't configured, pass requests straight through.
export default clerkEnabled ? withClerk : () => NextResponse.next();

export const config = {
  matcher: [
    // Skip Next internals and static files unless found in search params.
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes.
    '/(api|trpc)(.*)',
  ],
};
