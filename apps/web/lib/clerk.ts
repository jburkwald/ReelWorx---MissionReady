// Whether real Clerk auth is configured for this deployment.
//
// NEXT_PUBLIC_* vars are inlined at build time, so this is a build-time constant: deploy
// with no Clerk publishable key and the app runs in keyless DEMO mode (no Clerk anywhere);
// add the key and redeploy to turn real auth on. Clerk's own "keyless" dev mode does NOT
// work in a deployed/production environment, so we must skip Clerk entirely when unset, or
// every request 500s.
export const clerkEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.trim(),
);
