import {
  QUALITY_CREDITS,
  QUALITY_LABELS,
  CREDIT_PACKAGES,
  CATEGORIES,
  INITIAL_CREDITS,
  QualityLevel,
} from "@/types/database";

describe("QUALITY_CREDITS", () => {
  it("maps quality levels to correct credit costs", () => {
    expect(QUALITY_CREDITS[1]).toBe(0.5);
    expect(QUALITY_CREDITS[2]).toBe(1);
    expect(QUALITY_CREDITS[3]).toBe(2);
  });

  it("has entries for all quality levels", () => {
    const levels: QualityLevel[] = [1, 2, 3];
    levels.forEach((level) => {
      expect(QUALITY_CREDITS[level]).toBeDefined();
      expect(typeof QUALITY_CREDITS[level]).toBe("number");
    });
  });
});

describe("QUALITY_LABELS", () => {
  it("has names and icons for all quality levels", () => {
    expect(QUALITY_LABELS[1]).toEqual({ name: "FAST", icon: "⚡" });
    expect(QUALITY_LABELS[2]).toEqual({ name: "STANDARD", icon: "⭐" });
    expect(QUALITY_LABELS[3]).toEqual({ name: "HIGH", icon: "💎" });
  });
});

describe("CREDIT_PACKAGES", () => {
  it("has exactly 3 packages", () => {
    expect(CREDIT_PACKAGES).toHaveLength(3);
  });

  it("packages have increasing credits and prices", () => {
    for (let i = 1; i < CREDIT_PACKAGES.length; i++) {
      expect(CREDIT_PACKAGES[i].credits).toBeGreaterThan(
        CREDIT_PACKAGES[i - 1].credits
      );
      expect(CREDIT_PACKAGES[i].price).toBeGreaterThan(
        CREDIT_PACKAGES[i - 1].price
      );
    }
  });

  it("each package has better per-credit value than the previous", () => {
    const perCredit = CREDIT_PACKAGES.map(
      (pkg) => pkg.price / pkg.credits
    );
    for (let i = 1; i < perCredit.length; i++) {
      expect(perCredit[i]).toBeLessThan(perCredit[i - 1]);
    }
  });
});

describe("CATEGORIES", () => {
  it("has exactly 10 categories", () => {
    expect(CATEGORIES).toHaveLength(10);
  });

  it("contains expected categories", () => {
    expect(CATEGORIES).toContain("Product Photography");
    expect(CATEGORIES).toContain("Automotive");
    expect(CATEGORIES).toContain("Abstract & Conceptual");
  });
});

describe("INITIAL_CREDITS", () => {
  it("is 50", () => {
    expect(INITIAL_CREDITS).toBe(50);
  });
});
