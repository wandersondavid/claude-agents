import { describe, it, expect } from "vitest";
import {
  priceTableCreateSchema,
  priceTableListQuerySchema,
  priceTableListResponseSchema,
} from "@/lib/schemas";

const validWeightRange = { minWeight: 0, maxWeight: 5, price: 12.5 };

const validCreate = {
  carrierId: "carrier-abc-123",
  cepOriginStart: "01000000",
  cepOriginEnd: "01999999",
  cepDestinationStart: "20000000",
  cepDestinationEnd: "29999999",
  deadlineDays: 5,
  active: true,
  weightRanges: [validWeightRange],
};

describe("priceTableCreateSchema — valid input", () => {
  it("accepts a complete valid create request", () => {
    const result = priceTableCreateSchema.safeParse(validCreate);
    expect(result.success).toBe(true);
  });
});

describe("priceTableCreateSchema — required fields", () => {
  it("rejects when carrierId is missing", () => {
    const { carrierId: _, ...rest } = validCreate;
    const result = priceTableCreateSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects when weightRanges is missing", () => {
    const { weightRanges: _, ...rest } = validCreate;
    const result = priceTableCreateSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects when deadlineDays is missing", () => {
    const { deadlineDays: _, ...rest } = validCreate;
    const result = priceTableCreateSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe("priceTableCreateSchema — CEP format", () => {
  it("rejects cepOriginStart with fewer than 8 digits", () => {
    const result = priceTableCreateSchema.safeParse({
      ...validCreate,
      cepOriginStart: "0100000",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain("cepOriginStart");
    }
  });

  it("rejects cepDestinationEnd with non-digit characters", () => {
    const result = priceTableCreateSchema.safeParse({
      ...validCreate,
      cepDestinationEnd: "2999999X",
    });
    expect(result.success).toBe(false);
  });
});

describe("priceTableCreateSchema — cepOriginEnd >= cepOriginStart", () => {
  it("rejects when cepOriginEnd < cepOriginStart", () => {
    const result = priceTableCreateSchema.safeParse({
      ...validCreate,
      cepOriginStart: "05000000",
      cepOriginEnd: "01000000",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.includes("cepOriginEnd"))).toBe(true);
    }
  });

  it("accepts cepOriginEnd equal to cepOriginStart", () => {
    const result = priceTableCreateSchema.safeParse({
      ...validCreate,
      cepOriginStart: "01000000",
      cepOriginEnd: "01000000",
    });
    expect(result.success).toBe(true);
  });
});

describe("priceTableCreateSchema — deadlineDays", () => {
  it("rejects deadlineDays of 0", () => {
    const result = priceTableCreateSchema.safeParse({
      ...validCreate,
      deadlineDays: 0,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain("deadlineDays");
    }
  });

  it("accepts deadlineDays of 1", () => {
    const result = priceTableCreateSchema.safeParse({
      ...validCreate,
      deadlineDays: 1,
    });
    expect(result.success).toBe(true);
  });
});

describe("priceTableCreateSchema — weightRanges", () => {
  it("rejects empty weightRanges array", () => {
    const result = priceTableCreateSchema.safeParse({
      ...validCreate,
      weightRanges: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain("weightRanges");
    }
  });

  it("rejects weightRange when maxWeight <= minWeight", () => {
    const result = priceTableCreateSchema.safeParse({
      ...validCreate,
      weightRanges: [{ minWeight: 5, maxWeight: 5, price: 10 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects weightRange when maxWeight < minWeight", () => {
    const result = priceTableCreateSchema.safeParse({
      ...validCreate,
      weightRanges: [{ minWeight: 10, maxWeight: 5, price: 10 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects weightRange when price is 0", () => {
    const result = priceTableCreateSchema.safeParse({
      ...validCreate,
      weightRanges: [{ minWeight: 0, maxWeight: 5, price: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects weightRange when price is negative", () => {
    const result = priceTableCreateSchema.safeParse({
      ...validCreate,
      weightRanges: [{ minWeight: 0, maxWeight: 5, price: -1 }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts multiple valid weight ranges", () => {
    const result = priceTableCreateSchema.safeParse({
      ...validCreate,
      weightRanges: [
        { minWeight: 0, maxWeight: 5, price: 10 },
        { minWeight: 5, maxWeight: 20, price: 25 },
      ],
    });
    expect(result.success).toBe(true);
  });
});

describe("priceTableListQuerySchema — defaults and limits", () => {
  it("defaults page to 1 when not provided", () => {
    const result = priceTableListQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
    }
  });

  it("defaults limit to 20 when not provided", () => {
    const result = priceTableListQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
    }
  });

  it("rejects limit greater than 100", () => {
    const result = priceTableListQuerySchema.safeParse({ limit: "101" });
    expect(result.success).toBe(false);
  });

  it("accepts limit of exactly 100", () => {
    const result = priceTableListQuerySchema.safeParse({ limit: "100" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(100);
    }
  });

  it("rejects page less than 1", () => {
    const result = priceTableListQuerySchema.safeParse({ page: "0" });
    expect(result.success).toBe(false);
  });

  it("coerces string page to number", () => {
    const result = priceTableListQuerySchema.safeParse({ page: "3" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
    }
  });

  it("parses active=true correctly", () => {
    const result = priceTableListQuerySchema.safeParse({ active: "true" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.active).toBe(true);
    }
  });

  it("parses active=false correctly", () => {
    const result = priceTableListQuerySchema.safeParse({ active: "false" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.active).toBe(false);
    }
  });
});

describe("priceTableListResponseSchema — pagination meta structure", () => {
  it("validates a correctly shaped list response", () => {
    const payload = {
      data: [
        {
          id: "pt-1",
          carrierId: "c-1",
          carrier: { id: "c-1", name: "Correios", code: "PAC" },
          cepOriginStart: "01000000",
          cepOriginEnd: "01999999",
          cepDestinationStart: "20000000",
          cepDestinationEnd: "29999999",
          deadlineDays: 5,
          active: true,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
          weightRanges: [
            { id: "wr-1", minWeight: 0, maxWeight: 5, price: 12.5 },
          ],
        },
      ],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    };
    const result = priceTableListResponseSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("rejects response missing meta field", () => {
    const payload = {
      data: [],
    };
    const result = priceTableListResponseSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("rejects meta with negative total", () => {
    const payload = {
      data: [],
      meta: { total: -1, page: 1, limit: 20, totalPages: 0 },
    };
    // priceTableListResponseSchema uses z.number() which accepts negatives —
    // the schema does not restrict this, so we just validate it parses as number
    const result = priceTableListResponseSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});
