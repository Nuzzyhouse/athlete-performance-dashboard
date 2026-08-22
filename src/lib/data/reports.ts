import { prisma } from "@/lib/prisma";
import { getActiveRosterWithAnalytics, getAthleteDetail } from "@/lib/data/roster";

export interface ReportListRow {
  athleteId: string;
  athleteName: string;
  level: string;
  gap: number | null;
  category: string;
}

export async function getReportsList(): Promise<ReportListRow[]> {
  const { athletes, result } = await getActiveRosterWithAnalytics();
  return athletes
    .map((a) => {
      const analytics = result.athletes[a.id];
      return {
        athleteId: a.id,
        athleteName: a.name,
        level: a.level,
        gap: analytics.gap,
        category: analytics.category,
      };
    })
    .sort((a, b) => {
      if (a.gap === null && b.gap === null) return a.athleteName.localeCompare(b.athleteName);
      if (a.gap === null) return 1;
      if (b.gap === null) return -1;
      return a.gap - b.gap;
    });
}

const PLATE_METRICS = ["pp", "ppbm", "ci", "brfd", "mrsi"] as const;

export interface MetricReport {
  key: string;
  label: string;
  unit: string;
  baseline: number | null;
  current: number | null;
  changePct: number | null;
  trend: number[];
  trendDates: Date[];
}

export async function getAthleteReportData(athleteId: string) {
  const athlete = await prisma.athlete.findUnique({
    where: { id: athleteId },
    include: { tests: { orderBy: { date: "asc" } } },
  });
  if (!athlete) return null;

  const tests = athlete.tests;

  function metricReport(key: (typeof PLATE_METRICS)[number], label: string, unit: string): MetricReport {
    const measured = tests.filter((t) => t[key] > 0);
    if (measured.length === 0) {
      return { key, label, unit, baseline: null, current: null, changePct: null, trend: [], trendDates: [] };
    }
    const baseline = measured[0][key];
    const current = measured[measured.length - 1][key];
    const changePct =
      measured.length >= 2 && baseline > 0
        ? Math.round(((current - baseline) / baseline) * 1000) / 10
        : null;
    return {
      key,
      label,
      unit,
      baseline,
      current,
      changePct,
      trend: measured.map((m) => m[key]),
      trendDates: measured.map((m) => m.date),
    };
  }

  const mphMeasured = tests.filter((t) => t.mph > 0);
  const mphBaseline = mphMeasured[0]?.mph ?? null;
  const mphChangePct =
    mphMeasured.length >= 2 && mphBaseline && mphBaseline > 0
      ? Math.round(((athlete.mph - mphBaseline) / mphBaseline) * 1000) / 10
      : null;

  return {
    athlete,
    testCount: tests.length,
    plateMetrics: [
      metricReport("pp", "Peak Power", "W"),
      metricReport("ppbm", "Peak Power / BM", "W/kg"),
      metricReport("ci", "Concentric Impulse", "N·s"),
      metricReport("brfd", "Braking RFD", "N/s"),
      metricReport("mrsi", "mRSI", ""),
    ],
    velocity: {
      baseline: mphBaseline,
      current: athlete.mph, // exception: velocity always shows the athlete's best, not latest
      changePct: mphChangePct,
      trend: mphMeasured.map((m) => m.mph),
      trendDates: mphMeasured.map((m) => m.date),
    },
  };
}

export async function getFullReportData(athleteId: string) {
  const [detail, report] = await Promise.all([
    getAthleteDetail(athleteId),
    getAthleteReportData(athleteId),
  ]);
  if (!detail || !report) return null;
  return { ...detail, report };
}
