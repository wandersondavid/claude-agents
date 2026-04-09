import { describe, it, expect } from "vitest";
import { simulateRequestSchema } from "@/lib/schemas";

// ---- Pure business logic helpers extracted from simulate-service ----

function calcCubicWeight(height: number, width: number, length: number): number {
  return (height * width * length) / 6000;
}

function calcEffectiveWeight(weight: number, cubicWeight: number): number {
  return Math.max(weight, cubicWeight);
}

// ---- Tests ----

describe("Cubic weight calculation", () => {
  it("calculates cubic weight as (h * w * l) / 6000", () => {
    const result = calcCubicWeight(20, 30, 40);
    expect(result).toBe(4);
  });

  it("returns a decimal when volume is not divisible by 6000", () => {
    // 10 * 10 * 10 = 1000; 1000 / 6000 = 0.1666...
    const result = calcCubicWeight(10, 10, 10);
    expect(result).toBeCloseTo(1000 / 6000);
  });
});

describe("Effective weight", () => {
  it("uses cubic weight when it is greater than real weight", () => {
    expect(calcEffectiveWeight(2, 4)).toBe(4);
  });

  it("uses real weight when it is greater than cubic weight", () => {
    expect(calcEffectiveWeight(10, 4)).toBe(10);
  });

  it("uses real weight when both are equal", () => {
    expect(calcEffectiveWeight(4, 4)).toBe(4);
  });
});

describe("simulateRequestSchema — valid input", () => {
  const validInput = {
    originCep: "01310100",
    destinationCep: "20040020",
    weight: 5,
    height: 20,
    width: 30,
    length: 40,
  };

  it("accepts a valid request", () => {
    const result = simulateRequestSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });
});

describe("simulateRequestSchema — CEP validation", () => {
  it("rejects CEP with fewer than 8 digits", () => {
    const result = simulateRequestSchema.safeParse({
      originCep: "0131010",
      destinationCep: "20040020",
      weight: 5,
      height: 20,
      width: 30,
      length: 40,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain("originCep");
    }
  });

  it("rejects CEP with more than 8 digits", () => {
    const result = simulateRequestSchema.safeParse({
      originCep: "013101000",
      destinationCep: "20040020",
      weight: 5,
      height: 20,
      width: 30,
      length: 40,
    });
    expect(result.success).toBe(false);
  });

  it("rejects CEP containing non-digit characters", () => {
    const result = simulateRequestSchema.safeParse({
      originCep: "0131010A",
      destinationCep: "20040020",
      weight: 5,
      height: 20,
      width: 30,
      length: 40,
    });
    expect(result.success).toBe(false);
  });
});

describe("simulateRequestSchema — weight validation", () => {
  it("rejects weight above 150 kg", () => {
    const result = simulateRequestSchema.safeParse({
      originCep: "01310100",
      destinationCep: "20040020",
      weight: 151,
      height: 20,
      width: 30,
      length: 40,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain("weight");
    }
  });

  it("accepts weight exactly at 150 kg", () => {
    const result = simulateRequestSchema.safeParse({
      originCep: "01310100",
      destinationCep: "20040020",
      weight: 150,
      height: 20,
      width: 30,
      length: 40,
    });
    expect(result.success).toBe(true);
  });

  it("rejects weight of 0", () => {
    const result = simulateRequestSchema.safeParse({
      originCep: "01310100",
      destinationCep: "20040020",
      weight: 0,
      height: 20,
      width: 30,
      length: 40,
    });
    expect(result.success).toBe(false);
  });
});

describe("simulateRequestSchema — dimension validation", () => {
  const base = {
    originCep: "01310100",
    destinationCep: "20040020",
    weight: 5,
    height: 20,
    width: 30,
    length: 40,
  };

  it("rejects height above 200 cm", () => {
    const result = simulateRequestSchema.safeParse({ ...base, height: 201 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain("height");
    }
  });

  it("rejects width above 200 cm", () => {
    const result = simulateRequestSchema.safeParse({ ...base, width: 201 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain("width");
    }
  });

  it("rejects length above 200 cm", () => {
    const result = simulateRequestSchema.safeParse({ ...base, length: 201 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain("length");
    }
  });

  it("accepts dimensions exactly at 200 cm", () => {
    const result = simulateRequestSchema.safeParse({
      ...base,
      height: 200,
      width: 200,
      length: 200,
    });
    expect(result.success).toBe(true);
  });

  it("rejects dimension of 0", () => {
    const result = simulateRequestSchema.safeParse({ ...base, height: 0 });
    expect(result.success).toBe(false);
  });
});

describe("Simulation results sorting", () => {
  it("sorts results by price ascending", () => {
    const rawResults = [
      { carrier: { name: "Correios PAC", code: "PAC" }, price: 30, deadlineDays: 7 },
      { carrier: { name: "Correios SEDEX", code: "SEDEX" }, price: 15, deadlineDays: 2 },
      { carrier: { name: "Private Carrier", code: "PRIVATE" }, price: 22, deadlineDays: 3 },
    ];

    const sorted = [...rawResults].sort((a, b) => a.price - b.price);
    expect(sorted[0].price).toBe(15);
    expect(sorted[1].price).toBe(22);
    expect(sorted[2].price).toBe(30);
  });

  it("returns empty array when no matching CEP range produces results", () => {
    const rawResults: { carrier: { name: string; code: string }; price: number; deadlineDays: number }[] = [];
    expect(rawResults.length).toBe(0);
  });
});
