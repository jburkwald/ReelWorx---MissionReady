import { useAuth } from '@clerk/clerk-expo';
import { createApiClient } from '@reelworx/shared';
import { useMemo } from 'react';

// The backend is the web app's API (Next route handlers). The mobile app reaches it
// over HTTP — never via Prisma directly. The Clerk session token is attached as a
// Bearer header so the API can authenticate the request.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';

// The web origin (API base minus the trailing /api) — used to build public share links
// like the candidate's story profile (Feature 1.3).
export const WEB_URL = API_URL.replace(/\/api\/?$/, '');

export function useApi() {
  const { getToken } = useAuth();
  return useMemo(
    () => createApiClient({ baseUrl: API_URL, getToken: () => getToken() }),
    [getToken],
  );
}

// Minimal shape of GET /api/me (kept here, not derived from Prisma types, so the
// mobile bundle never depends on server-only code).
export interface MeResponse {
  user: {
    id: string;
    email: string;
    role: string;
    profile: { completenessScore: number } | null;
  };
}
