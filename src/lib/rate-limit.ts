import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ---------------------------------------------------------------------------
// Distributed rate limiter (Upstash Redis) with in-memory fallback for local dev
// ---------------------------------------------------------------------------

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    redis = new Redis({ url, token });
  }
  return redis;
}

// Cached Ratelimit instances keyed by "windowMs:max"
const limiters = new Map<string, Ratelimit>();

function getUpstashLimiter(windowMs: number, max: number): Ratelimit {
  const key = `${windowMs}:${max}`;
  if (limiters.has(key)) return limiters.get(key)!;

  const r = getRedis()!;
  const limiter = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(max, `${windowMs} ms`),
    prefix: "rl",
  });
  limiters.set(key, limiter);
  return limiter;
}

// ---------------------------------------------------------------------------
// In-memory fallback (for local dev or when Upstash is not configured)
// ---------------------------------------------------------------------------

const memMap = new Map<string, { count: number; resetAt: number }>();

function memoryRateLimit(
  key: string,
  windowMs: number,
  max: number
): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = memMap.get(key);

  if (!entry || now > entry.resetAt) {
    memMap.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: max - 1 };
  }

  if (entry.count >= max) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: max - entry.count };
}

// Periodic cleanup for in-memory map
if (typeof setInterval !== "undefined") {
  const cleanup = setInterval(() => {
    const now = Date.now();
    memMap.forEach((entry, key) => {
      if (now > entry.resetAt) memMap.delete(key);
    });
  }, 60_000);
  if (typeof cleanup === "object" && "unref" in cleanup) {
    cleanup.unref();
  }
}

// ---------------------------------------------------------------------------
// Public API — transparently uses Upstash if configured, else in-memory
// ---------------------------------------------------------------------------

interface RateLimitOptions {
  windowMs?: number;
  max?: number;
}

export async function rateLimit(
  key: string,
  { windowMs = 60_000, max = 10 }: RateLimitOptions = {}
): Promise<{ success: boolean; remaining: number }> {
  if (getRedis()) {
    const limiter = getUpstashLimiter(windowMs, max);
    const result = await limiter.limit(key);
    return { success: result.success, remaining: result.remaining };
  }
  return memoryRateLimit(key, windowMs, max);
}
