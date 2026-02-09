import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows requests within the limit", () => {
    const key = `test-allow-${Date.now()}`;
    const result = rateLimit(key, { max: 3, windowMs: 1000 });
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("blocks requests exceeding the limit", () => {
    const key = `test-block-${Date.now()}`;
    rateLimit(key, { max: 2, windowMs: 10000 });
    rateLimit(key, { max: 2, windowMs: 10000 });
    const result = rateLimit(key, { max: 2, windowMs: 10000 });
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("tracks remaining count correctly", () => {
    const key = `test-remaining-${Date.now()}`;
    const r1 = rateLimit(key, { max: 5, windowMs: 10000 });
    expect(r1.remaining).toBe(4);
    const r2 = rateLimit(key, { max: 5, windowMs: 10000 });
    expect(r2.remaining).toBe(3);
    const r3 = rateLimit(key, { max: 5, windowMs: 10000 });
    expect(r3.remaining).toBe(2);
  });

  it("uses separate counters for different keys", () => {
    const keyA = `test-a-${Date.now()}`;
    const keyB = `test-b-${Date.now()}`;
    rateLimit(keyA, { max: 1, windowMs: 10000 });
    const resultA = rateLimit(keyA, { max: 1, windowMs: 10000 });
    const resultB = rateLimit(keyB, { max: 1, windowMs: 10000 });
    expect(resultA.success).toBe(false);
    expect(resultB.success).toBe(true);
  });
});
