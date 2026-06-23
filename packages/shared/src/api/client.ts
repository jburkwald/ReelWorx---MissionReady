// Isomorphic HTTP API client.
//
// The MOBILE app and web client components use this to reach the backend API.
// Prisma is NEVER imported here — server-side data access goes through
// @reelworx/shared/server. `fetch` is global in React Native, Next.js, and Node 18+.
//
// Auth: pass a `getToken` that returns the current Clerk session token; it is sent
// as a Bearer header. baseUrl comes from EXPO_PUBLIC_API_URL (mobile) or
// NEXT_PUBLIC_WEB_URL + '/api' (web).

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  getToken?: () => Promise<string | null> | string | null;
}

export interface ApiClient {
  get<T>(path: string, init?: RequestInit): Promise<T>;
  post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T>;
  patch<T>(path: string, body?: unknown, init?: RequestInit): Promise<T>;
  del<T>(path: string, init?: RequestInit): Promise<T>;
}

export function createApiClient(opts: ApiClientOptions): ApiClient {
  const base = opts.baseUrl.replace(/\/$/, '');

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = opts.getToken ? await opts.getToken() : null;
    const res = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers ?? {}),
      },
    });

    if (!res.ok) {
      let body: unknown = undefined;
      try {
        body = await res.json();
      } catch {
        /* non-JSON error body */
      }
      const message =
        (body && typeof body === 'object' && 'error' in body
          ? String((body as { error: unknown }).error)
          : res.statusText) || `Request failed (${res.status})`;
      throw new ApiError(res.status, message, body);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  const withBody =
    (method: string) =>
    <T>(path: string, body?: unknown, init: RequestInit = {}) =>
      request<T>(path, {
        ...init,
        method,
        body: body === undefined ? undefined : JSON.stringify(body),
      });

  return {
    get: <T>(path: string, init?: RequestInit) => request<T>(path, init),
    post: withBody('POST'),
    patch: withBody('PATCH'),
    del: <T>(path: string, init?: RequestInit) =>
      request<T>(path, { ...init, method: 'DELETE' }),
  };
}
