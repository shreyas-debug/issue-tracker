/**
 * In-memory sliding-window rate limiter.
 *
 * Limits the number of requests from a single identifier (typically an IP
 * address) within a fixed time window. Intended for use on sensitive endpoints
 * such as login and registration to prevent brute-force attacks.
 *
 * Production note: this implementation is suitable for single-instance
 * deployments. For horizontally scaled environments, replace the Map with
 * a shared store such as Redis (via Upstash) to maintain consistent counts
 * across all instances.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number; // seconds until the window resets
}

export function checkRateLimit(identifier: string): RateLimitResult {
  const now = Date.now();
  const record = store.get(identifier);

  if (!record || now > record.resetAt) {
    store.set(identifier, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  if (record.count >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((record.resetAt - now) / 1000),
    };
  }

  record.count += 1;
  return { allowed: true, remaining: MAX_ATTEMPTS - record.count };
}

export function resetRateLimit(identifier: string): void {
  store.delete(identifier);
}
