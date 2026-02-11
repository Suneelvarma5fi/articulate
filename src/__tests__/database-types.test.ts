import {
  CREDITS_PER_GENERATION,
  CREDIT_PACKAGES,
  CATEGORIES,
  INITIAL_CREDITS,
} from "@/types/database";

describe("CREDITS_PER_GENERATION", () => {
  it("costs 1 credit per generation", () => {
    expect(CREDITS_PER_GENERATION).toBe(1);
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
  it("is 5", () => {
    expect(INITIAL_CREDITS).toBe(5);
  });
});
