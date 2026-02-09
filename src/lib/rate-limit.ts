const rateMap = new Map<string, { count: number; resetAt: number }>();

interface RateLimitOptions {
  windowMs?: number;
  max?: number;
}

export function rateLimit(
  key: string,
  { windowMs = 60_000, max = 10 }: RateLimitOptions = {}
): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: max - 1 };
  }

  if (entry.count >= max) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: max - entry.count };
}

// Clean up expired entries periodically (unref so it doesn't block process exit)
if (typeof setInterval !== "undefined") {
  const cleanup = setInterval(() => {
    const now = Date.now();
    rateMap.forEach((entry, key) => {
      if (now > entry.resetAt) {
        rateMap.delete(key);
      }
    });
  }, 60_000);
  if (typeof cleanup === "object" && "unref" in cleanup) {
    cleanup.unref();
  }
}
