import { z } from "zod";

// --- Shared field schemas ---

const cepSchema = z
  .string()
  .regex(/^\d{8}$/, "CEP must be exactly 8 digits");

// --- Simulate endpoint schemas ---

export const simulateRequestSchema = z.object({
  originCep: cepSchema,
  destinationCep: cepSchema,
  weight: z
    .number()
    .gt(0, "Weight must be greater than 0")
    .lte(150, "Weight must be at most 150 kg"),
  height: z
    .number()
    .gt(0, "Height must be greater than 0")
    .lte(200, "Height must be at most 200 cm"),
  width: z
    .number()
    .gt(0, "Width must be greater than 0")
    .lte(200, "Width must be at most 200 cm"),
  length: z
    .number()
    .gt(0, "Length must be greater than 0")
    .lte(200, "Length must be at most 200 cm"),
});

export type SimulateRequest = z.infer<typeof simulateRequestSchema>;

export const simulateResponseSchema = z.object({
  results: z.array(
    z.object({
      carrier: z.object({
        name: z.string(),
        code: z.string(),
      }),
      price: z.number(),
      deadlineDays: z.number(),
    })
  ),
  input: z.object({
    originCep: z.string(),
    destinationCep: z.string(),
    weight: z.number(),
    effectiveWeight: z.number(),
    cubicWeight: z.number(),
    height: z.number(),
    width: z.number(),
    length: z.number(),
  }),
});

export type SimulateResponse = z.infer<typeof simulateResponseSchema>;

// --- Weight range schema (reused in price table create/update) ---

const weightRangeInputSchema = z
  .object({
    minWeight: z.number().gte(0, "minWeight must be >= 0"),
    maxWeight: z.number().gt(0, "maxWeight must be > 0"),
    price: z.number().gt(0, "price must be > 0"),
  })
  .refine((data) => data.maxWeight > data.minWeight, {
    message: "maxWeight must be greater than minWeight",
    path: ["maxWeight"],
  });

// --- Price table schemas ---

export const priceTableCreateSchema = z
  .object({
    carrierId: z.string().min(1, "carrierId is required"),
    cepOriginStart: cepSchema,
    cepOriginEnd: cepSchema,
    cepDestinationStart: cepSchema,
    cepDestinationEnd: cepSchema,
    deadlineDays: z.number().int().gte(1, "deadlineDays must be >= 1"),
    active: z.boolean(),
    weightRanges: z
      .array(weightRangeInputSchema)
      .min(1, "At least one weight range is required"),
  })
  .refine((data) => data.cepOriginEnd >= data.cepOriginStart, {
    message: "cepOriginEnd must be >= cepOriginStart",
    path: ["cepOriginEnd"],
  })
  .refine((data) => data.cepDestinationEnd >= data.cepDestinationStart, {
    message: "cepDestinationEnd must be >= cepDestinationStart",
    path: ["cepDestinationEnd"],
  });

export type PriceTableCreateRequest = z.infer<typeof priceTableCreateSchema>;

export const priceTableUpdateSchema = priceTableCreateSchema;

export type PriceTableUpdateRequest = z.infer<typeof priceTableUpdateSchema>;

// --- Price table list query params ---

export const priceTableListQuerySchema = z.object({
  page: z.coerce.number().int().gte(1).default(1),
  limit: z.coerce.number().int().gte(1).lte(100).default(20),
  carrierId: z.string().optional(),
  active: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});

export type PriceTableListQuery = z.infer<typeof priceTableListQuerySchema>;

// --- Response types ---

export interface CarrierResponse {
  id: string;
  name: string;
  code: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export const carriersResponseSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      code: z.string(),
      active: z.boolean(),
      createdAt: z.string(),
      updatedAt: z.string(),
    })
  ),
});

export type CarriersResponse = z.infer<typeof carriersResponseSchema>;

export interface WeightRangeResponse {
  id: string;
  minWeight: number;
  maxWeight: number;
  price: number;
}

export interface PriceTableResponse {
  id: string;
  carrierId: string;
  carrier: {
    id: string;
    name: string;
    code: string;
  };
  cepOriginStart: string;
  cepOriginEnd: string;
  cepDestinationStart: string;
  cepDestinationEnd: string;
  deadlineDays: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  weightRanges: WeightRangeResponse[];
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const priceTableListResponseSchema = z.object({
  data: z.array(z.object({
    id: z.string(),
    carrierId: z.string(),
    carrier: z.object({
      id: z.string(),
      name: z.string(),
      code: z.string(),
    }),
    cepOriginStart: z.string(),
    cepOriginEnd: z.string(),
    cepDestinationStart: z.string(),
    cepDestinationEnd: z.string(),
    deadlineDays: z.number(),
    active: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
    weightRanges: z.array(z.object({
      id: z.string(),
      minWeight: z.number(),
      maxWeight: z.number(),
      price: z.number(),
    })),
  })),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  }),
});

export type PriceTableListResponse = z.infer<typeof priceTableListResponseSchema>;

export const priceTableSingleResponseSchema = z.object({
  data: z.object({
    id: z.string(),
    carrierId: z.string(),
    carrier: z.object({
      id: z.string(),
      name: z.string(),
      code: z.string(),
    }),
    cepOriginStart: z.string(),
    cepOriginEnd: z.string(),
    cepDestinationStart: z.string(),
    cepDestinationEnd: z.string(),
    deadlineDays: z.number(),
    active: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
    weightRanges: z.array(z.object({
      id: z.string(),
      minWeight: z.number(),
      maxWeight: z.number(),
      price: z.number(),
    })),
  }),
});

export type PriceTableSingleResponse = z.infer<typeof priceTableSingleResponseSchema>;

export const deleteResponseSchema = z.object({
  success: z.boolean(),
});

export type DeleteResponse = z.infer<typeof deleteResponseSchema>;
