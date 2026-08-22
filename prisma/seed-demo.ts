/**
 * Optional demo data for exercising the dashboard end to end. Not run in production —
 * `npm run seed:demo` only. Safe to delete once you have real roster data.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

interface DemoAthlete {
  name: string;
  level: string;
  isa: string;
  history: { daysAgo: number; pp: number; ppbm: number; ci: number; brfd: number; mrsi: number; mph?: number }[];
}

const DEMO: DemoAthlete[] = [
  {
    name: "Marcus Johnson",
    level: "D1",
    isa: "Narrow",
    history: [
      { daysAgo: 200, pp: 5000, ppbm: 60, ci: 200, brfd: 4600, mrsi: 0.4, mph: 85 },
      { daysAgo: 90, pp: 5300, ppbm: 63, ci: 215, brfd: 4800, mrsi: 0.43, mph: 88 },
      { daysAgo: 10, pp: 5600, ppbm: 66, ci: 230, brfd: 5000, mrsi: 0.46, mph: 90 },
    ],
  },
  {
    name: "Ethan Brooks",
    level: "D1",
    isa: "Wide",
    history: [
      { daysAgo: 180, pp: 5100, ppbm: 61, ci: 205, brfd: 4700, mrsi: 0.41, mph: 92 },
      { daysAgo: 70, pp: 5200, ppbm: 62, ci: 210, brfd: 4750, mrsi: 0.42, mph: 95 },
    ],
  },
  {
    name: "Diego Ramirez",
    level: "D2",
    isa: "None",
    history: [
      { daysAgo: 150, pp: 4800, ppbm: 58, ci: 195, brfd: 4500, mrsi: 0.39, mph: 79 },
      { daysAgo: 40, pp: 4950, ppbm: 59, ci: 200, brfd: 4600, mrsi: 0.4, mph: 80 },
    ],
  },
  {
    name: "Tyler Anderson",
    level: "Pro",
    isa: "Narrow",
    history: [
      { daysAgo: 220, pp: 6000, ppbm: 70, ci: 255, brfd: 5300, mrsi: 0.49, mph: 90 },
      { daysAgo: 100, pp: 6100, ppbm: 71, ci: 260, brfd: 5400, mrsi: 0.5, mph: 92 },
      { daysAgo: 5, pp: 6200, ppbm: 72, ci: 265, brfd: 5450, mrsi: 0.51, mph: 93 },
    ],
  },
  {
    name: "Caleb Foster",
    level: "JUCO",
    isa: "Wide",
    history: [{ daysAgo: 75, pp: 4700, ppbm: 57, ci: 190, brfd: 4400, mrsi: 0.38, mph: 84 }],
  },
  {
    name: "Wyatt Coleman",
    level: "D3",
    isa: "None",
    history: [
      { daysAgo: 300, pp: 4600, ppbm: 56, ci: 185, brfd: 4300, mrsi: 0.37, mph: 78 },
      { daysAgo: 130, pp: 4650, ppbm: 56.5, ci: 188, brfd: 4350, mrsi: 0.375, mph: 79 },
    ],
  },
  {
    name: "Owen Bennett",
    level: "High School",
    isa: "None",
    history: [], // never tested — exercises "awaiting data"
  },
];

async function main() {
  for (const demo of DEMO) {
    const sorted = [...demo.history].sort((a, b) => b.daysAgo - a.daysAgo); // oldest first for insert order
    let athlete = await prisma.athlete.upsert({
      where: { name: demo.name },
      update: { level: demo.level, isa: demo.isa },
      create: {
        name: demo.name,
        level: demo.level,
        isa: demo.isa,
        pp: 0,
        ppbm: 0,
        ci: 0,
        brfd: 0,
        mrsi: 0,
        mph: 0,
      },
    });

    for (const h of sorted) {
      const date = daysAgo(h.daysAgo);
      const mph = h.mph ?? 0;
      await prisma.testEntry.create({
        data: {
          athleteId: athlete.id,
          date,
          isForcePlate: true,
          pp: h.pp,
          ppbm: h.ppbm,
          ci: h.ci,
          brfd: h.brfd,
          mrsi: h.mrsi,
          mph,
        },
      });
      athlete = await prisma.athlete.update({
        where: { id: athlete.id },
        data: {
          pp: Math.max(athlete.pp, h.pp),
          ppbm: Math.max(athlete.ppbm, h.ppbm),
          ci: Math.max(athlete.ci, h.ci),
          brfd: Math.max(athlete.brfd, h.brfd),
          mrsi: Math.max(athlete.mrsi, h.mrsi),
          mph: Math.max(athlete.mph, mph),
          lastTestedAt: !athlete.lastTestedAt || date > athlete.lastTestedAt ? date : athlete.lastTestedAt,
        },
      });
    }

    console.log(`Seeded ${demo.name} (${sorted.length} tests)`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
