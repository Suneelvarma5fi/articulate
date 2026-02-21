import { CREDITS_PER_GENERATION } from "@/types/database";

// Replicate the validation logic from the generate route
function validateArticulation(
  text: string,
  characterLimit: number
): { valid: boolean; error?: string } {
  const trimmed = text.trim();

  if (!trimmed) {
    return { valid: false, error: "Articulation text is required" };
  }

  if (trimmed.length < 10) {
    return {
      valid: false,
      error: "Articulation must be at least 10 characters",
    };
  }

  if (trimmed.length > characterLimit) {
    return {
      valid: false,
      error: `Articulation exceeds ${characterLimit} character limit`,
    };
  }

  return { valid: true };
}

function canAfford(balance: number): boolean {
  return balance >= CREDITS_PER_GENERATION;
}

describe("validateArticulation", () => {
  it("rejects empty text", () => {
    const result = validateArticulation("", 150);
    expect(result.valid).toBe(false);
  });

  it("rejects whitespace-only text", () => {
    const result = validateArticulation("   ", 150);
    expect(result.valid).toBe(false);
  });

  it("rejects text shorter than 10 characters", () => {
    const result = validateArticulation("short", 150);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("at least 10 characters");
  });

  it("accepts text at minimum length", () => {
    const result = validateArticulation("1234567890", 150);
    expect(result.valid).toBe(true);
  });

  it("rejects text exceeding character limit", () => {
    const result = validateArticulation("a".repeat(151), 150);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("150 character limit");
  });

  it("accepts text at exactly the character limit", () => {
    const result = validateArticulation("a".repeat(150), 150);
    expect(result.valid).toBe(true);
  });

  it("trims whitespace before validation", () => {
    const result = validateArticulation("  valid description of image  ", 150);
    expect(result.valid).toBe(true);
  });
});

describe("canAfford", () => {
  it("allows generation with 5 credits", () => {
    expect(canAfford(5)).toBe(true);
  });

  it("denies generation with fewer than 5 credits", () => {
    expect(canAfford(4)).toBe(false);
    expect(canAfford(0)).toBe(false);
  });

  it("allows generation with many credits", () => {
    expect(canAfford(50)).toBe(true);
  });
});
