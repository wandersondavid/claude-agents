import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

interface CarrierSeed {
  name: string;
  code: string;
}

interface WeightRangeSeed {
  minWeight: number;
  maxWeight: number;
  price: number;
}

interface RegionDef {
  cepStart: string;
  cepEnd: string;
}

const carriers: CarrierSeed[] = [
  { name: "PAC", code: "PAC" },
  { name: "SEDEX", code: "SEDEX" },
  { name: "Transportadora Privada", code: "PRIVATE" },
];

const regions: RegionDef[] = [
  { cepStart: "01000000", cepEnd: "39999999" },
  { cepStart: "40000000", cepEnd: "69999999" },
  { cepStart: "70000000", cepEnd: "99999999" },
];

// Deadlines: [same region, adjacent, distant]
const deadlines: Record<string, [number, number, number]> = {
  PAC: [5, 8, 10],
  SEDEX: [2, 4, 6],
  PRIVATE: [3, 6, 8],
};

const weightRanges: Record<string, WeightRangeSeed[]> = {
  PAC: [
    { minWeight: 0, maxWeight: 1, price: 15.9 },
    { minWeight: 1, maxWeight: 5, price: 25.5 },
    { minWeight: 5, maxWeight: 10, price: 38.0 },
    { minWeight: 10, maxWeight: 30, price: 65.0 },
    { minWeight: 30, maxWeight: 50, price: 95.0 },
  ],
  SEDEX: [
    { minWeight: 0, maxWeight: 1, price: 25.9 },
    { minWeight: 1, maxWeight: 5, price: 42.5 },
    { minWeight: 5, maxWeight: 10, price: 62.0 },
    { minWeight: 10, maxWeight: 30, price: 98.0 },
    { minWeight: 30, maxWeight: 50, price: 145.0 },
  ],
  PRIVATE: [
    { minWeight: 0, maxWeight: 1, price: 18.9 },
    { minWeight: 1, maxWeight: 5, price: 30.0 },
    { minWeight: 5, maxWeight: 10, price: 45.0 },
    { minWeight: 10, maxWeight: 30, price: 72.0 },
    { minWeight: 30, maxWeight: 50, price: 110.0 },
  ],
};

function getDeadline(
  carrierCode: string,
  originIdx: number,
  destIdx: number
): number {
  const [same, adjacent, distant] = deadlines[carrierCode];
  const distance = Math.abs(originIdx - destIdx);
  if (distance === 0) return same;
  if (distance === 1) return adjacent;
  return distant;
}

async function main() {
  // Clean existing data
  await prisma.weightRange.deleteMany();
  await prisma.priceTable.deleteMany();
  await prisma.carrier.deleteMany();

  // Create carriers
  const createdCarriers = await Promise.all(
    carriers.map((c) =>
      prisma.carrier.create({
        data: { name: c.name, code: c.code, active: true },
      })
    )
  );

  // Create price tables with weight ranges for each carrier
  for (const carrier of createdCarriers) {
    const carrierWeightRanges = weightRanges[carrier.code];

    for (let originIdx = 0; originIdx < regions.length; originIdx++) {
      for (let destIdx = 0; destIdx < regions.length; destIdx++) {
        const origin = regions[originIdx];
        const dest = regions[destIdx];
        const deadline = getDeadline(carrier.code, originIdx, destIdx);

        await prisma.priceTable.create({
          data: {
            carrierId: carrier.id,
            cepOriginStart: origin.cepStart,
            cepOriginEnd: origin.cepEnd,
            cepDestinationStart: dest.cepStart,
            cepDestinationEnd: dest.cepEnd,
            deadlineDays: deadline,
            active: true,
            weightRanges: {
              create: carrierWeightRanges.map((wr) => ({
                minWeight: wr.minWeight,
                maxWeight: wr.maxWeight,
                price: wr.price,
              })),
            },
          },
        });
      }
    }
  }

  const tableCount = await prisma.priceTable.count();
  const rangeCount = await prisma.weightRange.count();

  process.stdout.write(
    `Seed completed: ${createdCarriers.length} carriers, ${tableCount} price tables, ${rangeCount} weight ranges\n`
  );
}

main()
  .catch((e) => {
    process.stderr.write(`Seed error: ${String(e)}\n`);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
