import { QUALITY_CREDITS, QualityLevel } from "@/types/database";

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

function canAfford(balance: number, qualityLevel: QualityLevel): boolean {
  return balance >= QUALITY_CREDITS[qualityLevel];
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
  it("allows fast quality with 0.5 credits", () => {
    expect(canAfford(0.5, 1)).toBe(true);
  });

  it("denies fast quality with 0 credits", () => {
    expect(canAfford(0, 1)).toBe(false);
  });

  it("allows standard quality with exactly 1 credit", () => {
    expect(canAfford(1, 2)).toBe(true);
  });

  it("denies high quality with 1.5 credits", () => {
    expect(canAfford(1.5, 3)).toBe(false);
  });

  it("allows high quality with 2 credits", () => {
    expect(canAfford(2, 3)).toBe(true);
  });

  it("allows any quality with 50 credits", () => {
    expect(canAfford(50, 1)).toBe(true);
    expect(canAfford(50, 2)).toBe(true);
    expect(canAfford(50, 3)).toBe(true);
  });
});
