import { prisma } from "@/lib/prisma";
import { getActiveRosterWithAnalytics } from "@/lib/data/roster";
import type { PredictionCategory } from "@/lib/prediction";

function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export interface QuadrantPoint {
  athleteId: string;
  athleteName: string;
  level: string;
  pp: number;
  mph: number;
  category: PredictionCategory;
}

export interface QuadrantData {
  points: QuadrantPoint[];
  medianPp: number;
  medianMph: number;
}

export interface LeaderboardRow {
  athleteId: string;
  athleteName: string;
  level: string;
  mph: number;
  pred: number;
  gap: number;
}

export interface MoverRow {
  athleteId: string;
  athleteName: string;
  then: number;
  now: number;
  gain: number;
}

export async function getAnalysisData() {
  const { athletes, result } = await getActiveRosterWithAnalytics();

  const quadrantPoints: QuadrantPoint[] = athletes
    .filter((a) => a.pp > 0 && a.mph > 0)
    .map((a) => ({
      athleteId: a.id,
      athleteName: a.name,
      level: a.level,
      pp: a.pp,
      mph: a.mph,
      category: result.athletes[a.id].category,
    }));

  const quadrant: QuadrantData = {
    points: quadrantPoints,
    medianPp: median(quadrantPoints.map((p) => p.pp)),
    medianMph: median(quadrantPoints.map((p) => p.mph)),
  };

  const gapRows: LeaderboardRow[] = athletes
    .map((a) => {
      const analytics = result.athletes[a.id];
      if (analytics.gap === null || analytics.pred === null) return null;
      return {
        athleteId: a.id,
        athleteName: a.name,
        level: a.level,
        mph: a.mph,
        pred: analytics.pred,
        gap: analytics.gap,
      };
    })
    .filter((r): r is LeaderboardRow => r !== null);

  const needsAttention = [...gapRows].sort((a, b) => a.gap - b.gap).slice(0, 10);
  const overperforming = [...gapRows].sort((a, b) => b.gap - a.gap).slice(0, 10);

  // Biggest movers: baseline (first) vs latest test, for velocity and peak power.
  const activeIds = athletes.map((a) => a.id);
  const allTests = await prisma.testEntry.findMany({
    where: { athleteId: { in: activeIds } },
    orderBy: { date: "asc" },
    include: { athlete: { select: { id: true, name: true } } },
  });

  const byAthlete = new Map<string, typeof allTests>();
  for (const t of allTests) {
    const list = byAthlete.get(t.athleteId) ?? [];
    list.push(t);
    byAthlete.set(t.athleteId, list);
  }

  function movers(metric: "mph" | "pp"): MoverRow[] {
    const rows: MoverRow[] = [];
    for (const [athleteId, tests] of byAthlete) {
      const measured = tests.filter((t) => t[metric] > 0);
      if (measured.length < 2) continue;
      const first = measured[0];
      const last = measured[measured.length - 1];
      const gain = Math.round((last[metric] - first[metric]) * 10) / 10;
      rows.push({
        athleteId,
        athleteName: first.athlete.name,
        then: first[metric],
        now: last[metric],
        gain,
      });
    }
    return rows.sort((a, b) => b.gain - a.gain).slice(0, 10);
  }

  return {
    quadrant,
    leaderboards: { needsAttention, overperforming },
    movers: { mph: movers("mph"), pp: movers("pp") },
  };
}
