"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

function num(formData: FormData, key: string): number {
  const raw = formData.get(key);
  const parsed = raw === null || raw === "" ? 0 : Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function createAthleteAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  await requireOwner();

  const name = str(formData, "name");
  const level = str(formData, "level");
  if (!name || !level) {
    return { error: "Name and level are required." };
  }

  const existing = await prisma.athlete.findUnique({ where: { name } });
  if (existing) {
    return { error: "An athlete with that name already exists." };
  }

  await prisma.athlete.create({
    data: {
      name,
      level,
      mph: num(formData, "mph"),
      pp: num(formData, "pp"),
      ppbm: num(formData, "ppbm"),
      ci: num(formData, "ci"),
      brfd: num(formData, "brfd"),
      mrsi: num(formData, "mrsi"),
    },
  });

  revalidatePath("/roster");
  revalidatePath("/");
  return {};
}

export async function archiveAthleteAction(athleteId: string, archived: boolean) {
  await requireOwner();
  await prisma.athlete.update({ where: { id: athleteId }, data: { archived } });
  revalidatePath("/roster");
  revalidatePath("/");
  revalidatePath("/analysis");
  revalidatePath("/reports");
}

export async function updateAthleteFieldsAction(
  athleteId: string,
  data: {
    name?: string;
    level?: string;
    isa?: string;
    predOverride?: number | null;
  },
) {
  await requireOwner();
  await prisma.athlete.update({ where: { id: athleteId }, data });
  revalidatePath(`/athletes/${athleteId}`);
  revalidatePath("/roster");
  revalidatePath("/analysis");
}

export async function updateRomAction(athleteId: string, rom: unknown) {
  await requireOwner();
  await prisma.athlete.update({ where: { id: athleteId }, data: { rom: rom as never } });
  revalidatePath(`/athletes/${athleteId}`);
}

/**
 * A force-plate test always resets the re-test clock (it's a test, not a PR),
 * and separately may raise the athlete's stored personal bests. A test's date
 * always comes from the entry itself, never "now" — importing an old test must
 * not disturb a more recent clock.
 */
export async function addForcePlateTestAction(
  athleteId: string,
  data: {
    date: Date;
    pp: number;
    ppbm: number;
    ci: number;
    brfd: number;
    mrsi: number;
    mph?: number;
  },
) {
  await requireOwner();

  const athlete = await prisma.athlete.findUniqueOrThrow({ where: { id: athleteId } });
  const mph = data.mph ?? 0;

  await prisma.$transaction([
    prisma.testEntry.create({
      data: {
        athleteId,
        date: data.date,
        isForcePlate: true,
        pp: data.pp,
        ppbm: data.ppbm,
        ci: data.ci,
        brfd: data.brfd,
        mrsi: data.mrsi,
        mph,
      },
    }),
    prisma.athlete.update({
      where: { id: athleteId },
      data: {
        pp: Math.max(athlete.pp, data.pp),
        ppbm: Math.max(athlete.ppbm, data.ppbm),
        ci: Math.max(athlete.ci, data.ci),
        brfd: Math.max(athlete.brfd, data.brfd),
        mrsi: Math.max(athlete.mrsi, data.mrsi),
        mph: Math.max(athlete.mph, mph),
        lastTestedAt:
          !athlete.lastTestedAt || data.date > athlete.lastTestedAt
            ? data.date
            : athlete.lastTestedAt,
      },
    }),
  ]);

  revalidatePath(`/athletes/${athleteId}`);
  revalidatePath("/roster");
  revalidatePath("/analysis");
  revalidatePath("/");
}

/** A performance-only reading — never satisfies the force-plate re-test clock. */
export async function logPerformanceAction(
  athleteId: string,
  data: { date: Date; mph: number },
) {
  await requireOwner();

  const athlete = await prisma.athlete.findUniqueOrThrow({ where: { id: athleteId } });

  await prisma.$transaction([
    prisma.testEntry.create({
      data: {
        athleteId,
        date: data.date,
        isForcePlate: false,
        mph: data.mph,
      },
    }),
    prisma.athlete.update({
      where: { id: athleteId },
      data: { mph: Math.max(athlete.mph, data.mph) },
    }),
  ]);

  revalidatePath(`/athletes/${athleteId}`);
  revalidatePath("/roster");
  revalidatePath("/analysis");
  revalidatePath("/");
}

export async function deleteTestEntryAction(testId: string) {
  await requireOwner();
  const test = await prisma.testEntry.delete({ where: { id: testId } });
  revalidatePath(`/athletes/${test.athleteId}`);
  revalidatePath("/roster");
  revalidatePath("/analysis");
  revalidatePath("/");
}

export async function updateTestEntryAction(
  testId: string,
  data: Partial<{
    date: Date;
    pp: number;
    ppbm: number;
    ci: number;
    brfd: number;
    mrsi: number;
    mph: number;
  }>,
) {
  await requireOwner();
  const test = await prisma.testEntry.update({ where: { id: testId }, data });
  revalidatePath(`/athletes/${test.athleteId}`);
  revalidatePath("/roster");
  revalidatePath("/analysis");
}
