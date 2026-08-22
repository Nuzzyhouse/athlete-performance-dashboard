import { prisma } from "@/lib/prisma";
import { computeAnalytics, type AthleteInput, type AnalyticsResult } from "@/lib/prediction";
import { clubTodayISO, daysBetweenISO, toClubISODate } from "@/lib/dates";
import { RETEST_WINDOW_DAYS } from "@/lib/constants";

export interface RosterAthlete extends AthleteInput {
  archived: boolean;
  isa: string;
  rom: unknown;
  createdAt: Date;
  updatedAt: Date;
  newestForcePlateTestDate: Date | null;
  daysSinceTest: number | null;
  /** Positive once past the retest window — "N days overdue". Null if never tested. */
  retestOverdueDays: number | null;
}

function toAthleteInput(a: {
  id: string;
  name: string;
  level: string;
  pp: number;
  ppbm: number;
  ci: number;
  brfd: number;
  mrsi: number;
  mph: number;
  predOverride: number | null;
}): AthleteInput {
  return {
    id: a.id,
    name: a.name,
    level: a.level,
    pp: a.pp,
    ppbm: a.ppbm,
    ci: a.ci,
    brfd: a.brfd,
    mrsi: a.mrsi,
    mph: a.mph,
    predOverride: a.predOverride,
  };
}

function withRetestClock<T extends { id: string; newestForcePlateTestDate: Date | null }>(
  a: T,
  todayISO: string,
): { daysSinceTest: number | null; retestOverdueDays: number | null } {
  if (!a.newestForcePlateTestDate) {
    return { daysSinceTest: null, retestOverdueDays: null };
  }
  const daysSinceTest = daysBetweenISO(toClubISODate(a.newestForcePlateTestDate), todayISO);
  return { daysSinceTest, retestOverdueDays: daysSinceTest - RETEST_WINDOW_DAYS };
}

/**
 * The single source of truth for the active roster + its computed analytics.
 * Every page that needs predictions, gaps, categories, ranks, or the retest clock
 * should read through this — never cache or store the computed fields.
 */
export async function getActiveRosterWithAnalytics(): Promise<{
  athletes: RosterAthlete[];
  result: AnalyticsResult;
}> {
  const athletes = await prisma.athlete.findMany({
    where: { archived: false },
    include: {
      tests: {
        where: { isForcePlate: true },
        orderBy: { date: "desc" },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  const inputs = athletes.map(toAthleteInput);
  const result = computeAnalytics(inputs);
  const todayISO = clubTodayISO();

  const rosterAthletes: RosterAthlete[] = athletes.map((a) => {
    const newestForcePlateTestDate = a.tests[0]?.date ?? null;
    const { daysSinceTest, retestOverdueDays } = withRetestClock(
      { id: a.id, newestForcePlateTestDate },
      todayISO,
    );
    return {
      ...toAthleteInput(a),
      archived: a.archived,
      isa: a.isa,
      rom: a.rom,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      newestForcePlateTestDate,
      daysSinceTest,
      retestOverdueDays,
    };
  });

  return { athletes: rosterAthletes, result };
}

/** Full roster including archived — for the Roster page's archived toggle. */
export async function getFullRoster() {
  const active = await getActiveRosterWithAnalytics();

  const archived = await prisma.athlete.findMany({
    where: { archived: true },
    include: {
      tests: { where: { isForcePlate: true }, orderBy: { date: "desc" }, take: 1 },
    },
    orderBy: { name: "asc" },
  });

  const todayISO = clubTodayISO();
  const archivedAthletes: RosterAthlete[] = archived.map((a) => {
    const newestForcePlateTestDate = a.tests[0]?.date ?? null;
    const { daysSinceTest, retestOverdueDays } = withRetestClock(
      { id: a.id, newestForcePlateTestDate },
      todayISO,
    );
    return {
      ...toAthleteInput(a),
      archived: a.archived,
      isa: a.isa,
      rom: a.rom,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      newestForcePlateTestDate,
      daysSinceTest,
      retestOverdueDays,
    };
  });

  return { active: active.athletes, archived: archivedAthletes, result: active.result };
}

export async function getAthleteDetail(id: string) {
  const athlete = await prisma.athlete.findUnique({
    where: { id },
    include: { tests: { orderBy: { date: "desc" } } },
  });
  if (!athlete) return null;

  // Recompute analytics over the active roster so this athlete's rank/pred/gap
  // are consistent with every other page — never trust a stored value.
  const { result } = athlete.archived
    ? { result: computeAnalytics([toAthleteInput(athlete)]) }
    : await getActiveRosterWithAnalytics();

  return {
    athlete,
    analytics: result.athletes[athlete.id] ?? null,
    excludedFromFit: result.excludedFromFit.some((e) => e.id === athlete.id),
  };
}
