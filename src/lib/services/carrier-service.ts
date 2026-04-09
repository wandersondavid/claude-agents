import { prisma } from "@/lib/prisma";
import type { CarriersResponse } from "@/lib/schemas";

export async function listCarriers(): Promise<CarriersResponse> {
  const carriers = await prisma.carrier.findMany({
    orderBy: { name: "asc" },
  });

  return {
    data: carriers.map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      active: c.active,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
  };
}
