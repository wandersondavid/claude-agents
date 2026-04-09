import { prisma } from "@/lib/prisma";
import type { SimulateRequest, SimulateResponse } from "@/lib/schemas";

interface SimulationResult {
  carrier: { name: string; code: string };
  price: number;
  deadlineDays: number;
}

export async function simulateFreight(
  input: SimulateRequest
): Promise<SimulateResponse> {
  const { originCep, destinationCep, weight, height, width, length } = input;

  const cubicWeight = (height * width * length) / 6000;
  const effectiveWeight = Math.max(weight, cubicWeight);

  // Find all active price tables that match the CEP ranges
  // and belong to active carriers, with their weight ranges
  const priceTables = await prisma.priceTable.findMany({
    where: {
      active: true,
      carrier: { active: true },
      cepOriginStart: { lte: originCep },
      cepOriginEnd: { gte: originCep },
      cepDestinationStart: { lte: destinationCep },
      cepDestinationEnd: { gte: destinationCep },
    },
    include: {
      carrier: {
        select: { name: true, code: true },
      },
      weightRanges: {
        where: {
          minWeight: { lte: effectiveWeight },
          maxWeight: { gt: effectiveWeight },
        },
      },
    },
  });

  // Build results: only include price tables that have a matching weight range
  const results: SimulationResult[] = [];

  for (const pt of priceTables) {
    if (pt.weightRanges.length === 0) {
      continue;
    }

    // Use the first matching weight range (there should be only one)
    const wr = pt.weightRanges[0];

    results.push({
      carrier: {
        name: pt.carrier.name,
        code: pt.carrier.code,
      },
      price: Math.round(wr.price * 100) / 100,
      deadlineDays: pt.deadlineDays,
    });
  }

  // Sort by price ascending
  results.sort((a, b) => a.price - b.price);

  return {
    results,
    input: {
      originCep,
      destinationCep,
      weight,
      effectiveWeight: Math.round(effectiveWeight * 1000) / 1000,
      cubicWeight: Math.round(cubicWeight * 1000) / 1000,
      height,
      width,
      length,
    },
  };
}
