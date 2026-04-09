import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";
import type {
  PriceTableCreateRequest,
  PriceTableUpdateRequest,
  PriceTableListQuery,
  PriceTableListResponse,
  PriceTableResponse,
} from "@/lib/schemas";

function formatPriceTable(pt: {
  id: string;
  carrierId: string;
  carrier: { id: string; name: string; code: string };
  cepOriginStart: string;
  cepOriginEnd: string;
  cepDestinationStart: string;
  cepDestinationEnd: string;
  deadlineDays: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  weightRanges: Array<{
    id: string;
    minWeight: number;
    maxWeight: number;
    price: number;
  }>;
}): PriceTableResponse {
  return {
    id: pt.id,
    carrierId: pt.carrierId,
    carrier: {
      id: pt.carrier.id,
      name: pt.carrier.name,
      code: pt.carrier.code,
    },
    cepOriginStart: pt.cepOriginStart,
    cepOriginEnd: pt.cepOriginEnd,
    cepDestinationStart: pt.cepDestinationStart,
    cepDestinationEnd: pt.cepDestinationEnd,
    deadlineDays: pt.deadlineDays,
    active: pt.active,
    createdAt: pt.createdAt.toISOString(),
    updatedAt: pt.updatedAt.toISOString(),
    weightRanges: pt.weightRanges.map((wr) => ({
      id: wr.id,
      minWeight: wr.minWeight,
      maxWeight: wr.maxWeight,
      price: Math.round(wr.price * 100) / 100,
    })),
  };
}

const priceTableInclude = {
  carrier: {
    select: { id: true, name: true, code: true },
  },
  weightRanges: {
    select: { id: true, minWeight: true, maxWeight: true, price: true },
    orderBy: { minWeight: "asc" as const },
  },
} as const;

export async function listPriceTables(
  query: PriceTableListQuery
): Promise<PriceTableListResponse> {
  const { page, limit, carrierId, active } = query;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (carrierId !== undefined) {
    where.carrierId = carrierId;
  }
  if (active !== undefined) {
    where.active = active;
  }

  const [priceTables, total] = await Promise.all([
    prisma.priceTable.findMany({
      where,
      include: priceTableInclude,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.priceTable.count({ where }),
  ]);

  return {
    data: priceTables.map(formatPriceTable),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getPriceTableById(
  id: string
): Promise<PriceTableResponse> {
  const pt = await prisma.priceTable.findUnique({
    where: { id },
    include: priceTableInclude,
  });

  if (!pt) {
    throw new ApiError("NOT_FOUND", `PriceTable with id '${id}' not found`, 404);
  }

  return formatPriceTable(pt);
}

export async function createPriceTable(
  data: PriceTableCreateRequest
): Promise<PriceTableResponse> {
  // Verify carrier exists
  const carrier = await prisma.carrier.findUnique({
    where: { id: data.carrierId },
  });

  if (!carrier) {
    throw new ApiError(
      "VALIDATION_ERROR",
      `Carrier with id '${data.carrierId}' not found`,
      400
    );
  }

  const pt = await prisma.priceTable.create({
    data: {
      carrierId: data.carrierId,
      cepOriginStart: data.cepOriginStart,
      cepOriginEnd: data.cepOriginEnd,
      cepDestinationStart: data.cepDestinationStart,
      cepDestinationEnd: data.cepDestinationEnd,
      deadlineDays: data.deadlineDays,
      active: data.active,
      weightRanges: {
        create: data.weightRanges.map((wr) => ({
          minWeight: wr.minWeight,
          maxWeight: wr.maxWeight,
          price: Math.round(wr.price * 100) / 100,
        })),
      },
    },
    include: priceTableInclude,
  });

  return formatPriceTable(pt);
}

export async function updatePriceTable(
  id: string,
  data: PriceTableUpdateRequest
): Promise<PriceTableResponse> {
  // Verify price table exists
  const existing = await prisma.priceTable.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError("NOT_FOUND", `PriceTable with id '${id}' not found`, 404);
  }

  // Verify carrier exists
  const carrier = await prisma.carrier.findUnique({
    where: { id: data.carrierId },
  });
  if (!carrier) {
    throw new ApiError(
      "VALIDATION_ERROR",
      `Carrier with id '${data.carrierId}' not found`,
      400
    );
  }

  // Full replace: delete existing weight ranges and create new ones in a transaction
  const pt = await prisma.$transaction(async (tx) => {
    await tx.weightRange.deleteMany({ where: { priceTableId: id } });

    return tx.priceTable.update({
      where: { id },
      data: {
        carrierId: data.carrierId,
        cepOriginStart: data.cepOriginStart,
        cepOriginEnd: data.cepOriginEnd,
        cepDestinationStart: data.cepDestinationStart,
        cepDestinationEnd: data.cepDestinationEnd,
        deadlineDays: data.deadlineDays,
        active: data.active,
        weightRanges: {
          create: data.weightRanges.map((wr) => ({
            minWeight: wr.minWeight,
            maxWeight: wr.maxWeight,
            price: Math.round(wr.price * 100) / 100,
          })),
        },
      },
      include: priceTableInclude,
    });
  });

  return formatPriceTable(pt);
}

export async function deletePriceTable(id: string): Promise<void> {
  const existing = await prisma.priceTable.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError("NOT_FOUND", `PriceTable with id '${id}' not found`, 404);
  }

  // Cascade delete handles weight ranges
  await prisma.priceTable.delete({ where: { id } });
}
