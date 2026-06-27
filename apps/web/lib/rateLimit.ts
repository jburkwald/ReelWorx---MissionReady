// Tiny in-memory, per-IP rate limiter for the unauthenticated routes (voice + guest story).
// These call paid providers (ElevenLabs, Anthropic), so a leaked key or a public deploy
// shouldn't let anyone burn credits. In-process only — fine for a single dev/server node;
// swap for a shared store (e.g. Upstash) before horizontal scaling.

const hits = new Map<string, number[]>();

/** Returns true if the call is allowed; false if the window limit is exceeded. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

/** Best-effort client IP from proxy headers; falls back to a constant on localhost. */
export function clientIp(req: Request): string {
  const h = req.headers;
  const fwd = h.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  return h.get('x-real-ip')?.trim() || 'local';
}

/** Convenience: guard a route by name + IP. Returns a 429 Response when limited, else null. */
export function checkRate(
  req: Request,
  name: string,
  limit: number,
  windowMs = 60_000,
): Response | null {
  if (rateLimit(`${name}:${clientIp(req)}`, limit, windowMs)) return null;
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please slow down and try again shortly.' }),
    { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '30' } },
  );
}
