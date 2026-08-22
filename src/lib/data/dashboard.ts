import { prisma } from "@/lib/prisma";
import { getActiveRosterWithAnalytics } from "@/lib/data/roster";
import { relativeDay } from "@/lib/dates";

const PLATE_METRICS = ["pp", "ppbm", "ci", "brfd", "mrsi"] as const;

interface RawTestEntry {
  id: string;
  athleteId: string;
  date: Date;
  isForcePlate: boolean;
  mph: number;
  pp: number;
  ppbm: number;
  ci: number;
  brfd: number;
  mrsi: number;
}

/** Which metrics on this entry were an all-time best at the moment it landed. */
function computePrFlags(testsAsc: RawTestEntry[]): Map<string, string[]> {
  const running: Record<string, number> = { mph: 0, pp: 0, ppbm: 0, ci: 0, brfd: 0, mrsi: 0 };
  const prFlags = new Map<string, string[]>();

  for (const t of testsAsc) {
    const prs: string[] = [];
    for (const metric of ["mph", ...PLATE_METRICS] as const) {
      const value = t[metric];
      if (value > 0 && value > running[metric]) {
        prs.push(metric);
        running[metric] = value;
      }
    }
    prFlags.set(t.id, prs);
  }

  return prFlags;
}

export interface ActivitySession {
  athleteId: string;
  athleteName: string;
  date: Date;
  dateLabel: string;
  hasForcePlate: boolean;
  hasPerformance: boolean;
  mph: number | null;
  plateSummary: string | null;
  prMetrics: string[];
  mphDelta: number | null;
  currentlyFlagged: "high-priority" | "moderate" | null;
}

export interface RetestRow {
  athleteId: string;
  athleteName: string;
  level: string;
  newestForcePlateTestDate: Date | null;
  daysSinceTest: number | null;
  retestOverdueDays: number | null;
}

export interface ConversationRow {
  athleteId: string;
  athleteName: string;
  level: string;
  mph: number;
  pred: number;
  gap: number;
  category: "high-priority" | "moderate";
  powerSparkline: number[];
}

export interface DashboardData {
  recentActivity: ActivitySession[];
  needsConversation: ConversationRow[];
  dueToRetest: RetestRow[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const { athletes, result } = await getActiveRosterWithAnalytics();
  const athleteById = new Map(athletes.map((a) => [a.id, a]));

  const recentTests = await prisma.testEntry.findMany({
    where: { athlete: { archived: false } },
    orderBy: { date: "desc" },
    take: 200,
    include: { athlete: { select: { id: true, name: true } } },
  });

  // Group same-day entries per athlete into one session row.
  const sessionMap = new Map<
    string,
    { athleteId: string; athleteName: string; date: Date; entries: RawTestEntry[] }
  >();
  for (const t of recentTests) {
    const dayKey = `${t.athleteId}:${t.date.toISOString().slice(0, 10)}`;
    const existing = sessionMap.get(dayKey);
    if (existing) {
      existing.entries.push(t);
    } else {
      sessionMap.set(dayKey, {
        athleteId: t.athleteId,
        athleteName: t.athlete.name,
        date: t.date,
        entries: [t],
      });
    }
  }

  // PR detection needs each athlete's full ascending history, not just the recent window.
  const allTestsByAthlete = new Map<string, RawTestEntry[]>();
  const allTests = await prisma.testEntry.findMany({
    where: { athleteId: { in: [...new Set(recentTests.map((t) => t.athleteId))] } },
    orderBy: [{ date: "asc" }, { id: "asc" }],
  });
  for (const t of allTests) {
    const list = allTestsByAthlete.get(t.athleteId) ?? [];
    list.push(t);
    allTestsByAthlete.set(t.athleteId, list);
  }
  const prFlagsByAthlete = new Map<string, Map<string, string[]>>();
  for (const [athleteId, tests] of allTestsByAthlete) {
    prFlagsByAthlete.set(athleteId, computePrFlags(tests));
  }

  const sessions = [...sessionMap.values()]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 25)
    .map((session): ActivitySession => {
      const plateEntry = session.entries.find((e) => e.isForcePlate);
      const perfEntry = session.entries.find((e) => e.mph > 0);
      const prFlags = prFlagsByAthlete.get(session.athleteId);
      const prMetrics = new Set<string>();
      for (const e of session.entries) {
        for (const m of prFlags?.get(e.id) ?? []) prMetrics.add(m);
      }

      // Change vs this athlete's previous mph reading (not merely the last row shown).
      let mphDelta: number | null = null;
      if (perfEntry) {
        const history = allTestsByAthlete.get(session.athleteId) ?? [];
        const priorPerf = [...history]
          .filter((h) => h.mph > 0 && h.id !== perfEntry.id)
          .filter((h) => h.date.getTime() <= session.date.getTime())
          .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
        if (priorPerf) mphDelta = Math.round((perfEntry.mph - priorPerf.mph) * 10) / 10;
      }

      const rosterAthlete = athleteById.get(session.athleteId);
      const category = rosterAthlete ? result.athletes[session.athleteId]?.category : null;
      const currentlyFlagged =
        category === "high-priority" || category === "moderate" ? category : null;

      const plateSummary = plateEntry
        ? `PP ${Math.round(plateEntry.pp)}W · CI ${Math.round(plateEntry.ci)}N·s`
        : null;

      return {
        athleteId: session.athleteId,
        athleteName: session.athleteName,
        date: session.date,
        dateLabel: relativeDay(session.date),
        hasForcePlate: !!plateEntry,
        hasPerformance: !!perfEntry,
        mph: perfEntry?.mph ?? null,
        plateSummary,
        prMetrics: [...prMetrics],
        mphDelta,
        currentlyFlagged,
      };
    });

  const needsConversation: ConversationRow[] = athletes
    .map((a) => {
      const analytics = result.athletes[a.id];
      if (analytics.category !== "high-priority" && analytics.category !== "moderate") {
        return null;
      }
      const history = allTestsByAthlete.get(a.id);
      const powerSparkline = history
        ? history
            .filter((t) => t.pp > 0)
            .slice(-8)
            .map((t) => t.pp)
        : [];
      return {
        athleteId: a.id,
        athleteName: a.name,
        level: a.level,
        mph: a.mph,
        pred: analytics.pred!,
        gap: analytics.gap!,
        category: analytics.category,
        powerSparkline,
      };
    })
    .filter((r): r is ConversationRow => r !== null)
    .sort((a, b) => a.gap - b.gap);

  const dueToRetest: RetestRow[] = athletes
    .map((a) => ({
      athleteId: a.id,
      athleteName: a.name,
      level: a.level,
      newestForcePlateTestDate: a.newestForcePlateTestDate,
      daysSinceTest: a.daysSinceTest,
      retestOverdueDays: a.retestOverdueDays,
    }))
    .sort((a, b) => {
      // Never-tested athletes are the most urgent — surface them first.
      if (a.retestOverdueDays === null && b.retestOverdueDays === null) return 0;
      if (a.retestOverdueDays === null) return -1;
      if (b.retestOverdueDays === null) return 1;
      return b.retestOverdueDays - a.retestOverdueDays;
    });

  return { recentActivity: sessions, needsConversation, dueToRetest };
}
