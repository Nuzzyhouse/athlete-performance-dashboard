/**
 * The velocity-prediction engine. This is the one file to rewrite when adapting the
 * dashboard to a different sport or population — keep the same input/output shape
 * (raw metrics in, pred/gap/category/ranks out) and nothing downstream needs to change.
 *
 * Callers MUST pass only the active (non-archived) roster — every calculation here
 * assumes that filtering already happened.
 */

export const FP_SENSITIVITY = 1.6;

const OUTLIER_Z_THRESHOLD = 3.5;
const MAX_DROP_FRACTION = 0.1;
const MIN_FIT_SET_SIZE = 8;

export const METRICS = ["pp", "ppbm", "ci", "mph", "brfd", "mrsi"] as const;
export type MetricKey = (typeof METRICS)[number];

export interface AthleteInput {
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
}

export type PredictionCategory =
  | "insufficient-data"
  | "awaiting-data"
  | "awaiting-performance"
  | "high-priority"
  | "moderate"
  | "on-track"
  | "overperforming";

export interface MetricRank {
  rank: number | null;
  percentile: number | null;
  flagged: boolean;
}

export interface AthleteAnalytics {
  id: string;
  pred: number | null;
  gap: number | null;
  category: PredictionCategory;
  model: "regression" | "manual" | null;
  offset: number | null;
  ranks: Record<MetricKey, MetricRank>;
}

export interface RegressionMeta {
  meanVelo: number;
  pp: { slope: number; intercept: number };
  ppbm: { slope: number; intercept: number };
  ci: { slope: number; intercept: number };
}

export interface AnalyticsResult {
  insufficientData: boolean;
  fitSetSize: number;
  excludedFromFit: { id: string; name: string; reason: string }[];
  regression: RegressionMeta | null;
  athletes: Record<string, AthleteAnalytics>;
}

function round1(x: number): number {
  return Math.round(x * 10) / 10;
}

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const n = s.length;
  const mid = Math.floor(n / 2);
  return n % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function mad(xs: number[], med: number): number {
  return median(xs.map((x) => Math.abs(x - med)));
}

function sumSquaredDeviation(xs: number[]): number {
  const xbar = mean(xs);
  return xs.reduce((sum, x) => sum + (x - xbar) ** 2, 0);
}

function linearRegression(xs: number[], ys: number[]): { slope: number; intercept: number } | null {
  const xbar = mean(xs);
  const ybar = mean(ys);
  let num = 0;
  let den = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - xbar) * (ys[i] - ybar);
    den += (xs[i] - xbar) ** 2;
  }
  if (den === 0) return null;
  const slope = num / den;
  return { slope, intercept: ybar - slope * xbar };
}

/**
 * Robust-z outlier hold-out. Uses median/MAD (not mean/stddev) so a single extreme
 * value can't inflate the spread and hide itself. Never drops more than ~10% of the
 * candidate set, and never trims below MIN_FIT_SET_SIZE athletes.
 */
function trimExtremes(candidates: AthleteInput[]): {
  fitSet: AthleteInput[];
  excluded: AthleteInput[];
} {
  if (candidates.length <= MIN_FIT_SET_SIZE) {
    return { fitSet: candidates, excluded: [] };
  }

  const mphVals = candidates.map((a) => a.mph);
  const ppVals = candidates.map((a) => a.pp);
  const medMph = median(mphVals);
  const madMph = mad(mphVals, medMph);
  const medPp = median(ppVals);
  const madPp = mad(ppVals, medPp);

  const scored = candidates.map((a) => {
    const zMph = madMph > 0 ? (0.6745 * (a.mph - medMph)) / madMph : 0;
    const zPp = madPp > 0 ? (0.6745 * (a.pp - medPp)) / madPp : 0;
    return { athlete: a, score: Math.max(Math.abs(zMph), Math.abs(zPp)) };
  });

  const eligible = scored
    .filter((s) => s.score > OUTLIER_Z_THRESHOLD)
    .sort((a, b) => b.score - a.score);

  const maxDrop = Math.floor(candidates.length * MAX_DROP_FRACTION);
  const maxAllowedByFloor = Math.max(0, candidates.length - MIN_FIT_SET_SIZE);
  const dropCount = Math.min(eligible.length, maxDrop, maxAllowedByFloor);

  const excludedIds = new Set(eligible.slice(0, dropCount).map((s) => s.athlete.id));

  return {
    fitSet: candidates.filter((a) => !excludedIds.has(a.id)),
    excluded: candidates.filter((a) => excludedIds.has(a.id)),
  };
}

function categorize(gap: number): PredictionCategory {
  if (gap <= -3.0) return "high-priority";
  if (gap <= -2.0) return "moderate";
  if (gap < 3.0) return "on-track";
  return "overperforming";
}

function computeRanks(active: AthleteInput[]): Record<string, Record<MetricKey, MetricRank>> {
  const result: Record<string, Record<MetricKey, MetricRank>> = {};
  for (const a of active) {
    result[a.id] = {} as Record<MetricKey, MetricRank>;
  }

  for (const metric of METRICS) {
    // An unmeasured metric (value = 0) never ranks and never flags — it isn't a
    // real low value, it's a placeholder for "not tested yet."
    const measured = active.filter((a) => a[metric] > 0).sort((a, b) => b[metric] - a[metric]);
    const m = measured.length;

    const ascending = [...measured].sort((a, b) => a[metric] - b[metric]);
    const threshold = m > 0 ? ascending[Math.min(Math.floor(m * 0.25), m - 1)][metric] : null;

    for (const a of active) {
      if (a[metric] <= 0) {
        result[a.id][metric] = { rank: null, percentile: null, flagged: false };
        continue;
      }
      const rank = measured.findIndex((x) => x.id === a.id) + 1;
      const percentile = Math.round((1 - rank / m) * 100);
      const flagged = threshold !== null && a[metric] <= threshold;
      result[a.id][metric] = { rank, percentile, flagged };
    }
  }

  return result;
}

function insufficientResult(
  active: AthleteInput[],
  ranks: Record<string, Record<MetricKey, MetricRank>>,
): AnalyticsResult {
  const athletes: Record<string, AthleteAnalytics> = {};
  for (const a of active) {
    athletes[a.id] = {
      id: a.id,
      pred: null,
      gap: null,
      category: "insufficient-data",
      model: null,
      offset: null,
      ranks: ranks[a.id],
    };
  }
  return { insufficientData: true, fitSetSize: 0, excludedFromFit: [], regression: null, athletes };
}

export function computeAnalytics(active: AthleteInput[]): AnalyticsResult {
  const ranks = computeRanks(active);

  // Fit set candidates: need both a measured performance AND real force-plate data.
  const candidates = active.filter((a) => a.mph > 0 && a.pp > 0);
  if (candidates.length < 2) {
    return insufficientResult(active, ranks);
  }

  const { fitSet, excluded } = trimExtremes(candidates);

  if (fitSet.length < 2) {
    return insufficientResult(active, ranks);
  }

  const regPP = linearRegression(fitSet.map((a) => a.pp), fitSet.map((a) => a.mph));
  const regPPBM = linearRegression(fitSet.map((a) => a.ppbm), fitSet.map((a) => a.mph));
  const regCI = linearRegression(fitSet.map((a) => a.ci), fitSet.map((a) => a.mph));
  if (!regPP || !regPPBM || !regCI) {
    // A zero denominator (e.g. every fit-set athlete has an identical value) means the
    // regression is undefined — fail safe rather than let a NaN reach the screen.
    return insufficientResult(active, ranks);
  }

  const meanVelo = mean(fitSet.map((a) => a.mph));

  function fpPredFor(a: AthleteInput): number {
    const raw =
      (regPP!.slope * a.pp +
        regPP!.intercept +
        (regPPBM!.slope * a.ppbm + regPPBM!.intercept) +
        (regCI!.slope * a.ci + regCI!.intercept)) /
      3;
    return meanVelo + FP_SENSITIVITY * (raw - meanVelo);
  }

  const fitSetFpPred = new Map(fitSet.map((a) => [a.id, fpPredFor(a)]));

  function offsetFor(a: AthleteInput): number {
    let peers = fitSet.filter((p) => p.id !== a.id && p.level === a.level);
    if (peers.length < 2) {
      peers = fitSet.filter((p) => p.id !== a.id);
    }
    if (peers.length === 0) return 0;
    return mean(peers.map((p) => p.mph - fitSetFpPred.get(p.id)!));
  }

  const athletesOut: Record<string, AthleteAnalytics> = {};

  for (const a of active) {
    const rankInfo = ranks[a.id];

    // Awaiting data: no force-plate test yet — no pred, no gap.
    if (a.pp <= 0) {
      athletesOut[a.id] = {
        id: a.id,
        pred: null,
        gap: null,
        category: "awaiting-data",
        model: null,
        offset: null,
        ranks: rankInfo,
      };
      continue;
    }

    let pred: number;
    let model: "regression" | "manual";
    let offset: number | null = null;

    if (a.predOverride != null && a.predOverride > 0) {
      pred = round1(a.predOverride);
      model = "manual";
    } else {
      offset = offsetFor(a);
      pred = round1(fpPredFor(a) + offset);
      model = "regression";
    }

    // Awaiting performance: tested, but no measured KPI — has a pred, no gap.
    if (a.mph <= 0) {
      athletesOut[a.id] = {
        id: a.id,
        pred,
        gap: null,
        category: "awaiting-performance",
        model,
        offset,
        ranks: rankInfo,
      };
      continue;
    }

    const gap = round1(a.mph - pred);
    athletesOut[a.id] = {
      id: a.id,
      pred,
      gap,
      category: categorize(gap),
      model,
      offset,
      ranks: rankInfo,
    };
  }

  return {
    insufficientData: false,
    fitSetSize: fitSet.length,
    excludedFromFit: excluded.map((e) => ({
      id: e.id,
      name: e.name,
      reason: "statistical outlier — held out of the regression fit, still predicted and ranked normally",
    })),
    regression: {
      meanVelo,
      pp: regPP,
      ppbm: regPPBM,
      ci: regCI,
    },
    athletes: athletesOut,
  };
}

// Exported for the snapshot test only.
export const __internal = { linearRegression, sumSquaredDeviation, median, mad, trimExtremes };
