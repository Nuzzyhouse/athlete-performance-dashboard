import type { ValdTrial } from "@/lib/vald/client";

// The impulse key is the one to get wrong: CONCENTRIC_IMPULSE (full phase) is roughly
// 2x CONCENTRIC_IMPULSE_100MS (the 0-100ms window the model wants) and both import
// cleanly with no error — just silently-wrong PRs and predictions. Get this exact.
const RESULT_KEY = {
  pp: "PEAK_TAKEOFF_POWER",
  ppbm: "BODYMASS_RELATIVE_TAKEOFF_POWER",
  ci: "CONCENTRIC_IMPULSE_100MS",
  brfd: "ECCENTRIC_BRAKING_RFD",
  mrsi: "RSI_MODIFIED",
} as const;

export interface MappedCmjMetrics {
  pp: number;
  ppbm: number;
  ci: number;
  brfd: number;
  mrsi: number;
}

/** Extracts the five dashboard metrics from a CMJ test's trials. Returns null if the
 * trial data doesn't contain a usable "Trial"-limb result set. */
export function mapCmjTrialsToMetrics(trials: ValdTrial[]): MappedCmjMetrics | null {
  if (trials.length === 0) return null;

  // Use the most recent/best trial's "Trial" (combined limb) results.
  const trial = trials[trials.length - 1];
  const byResultKey = new Map<string, number>();
  for (const r of trial.results) {
    if (r.limb === "Trial") {
      byResultKey.set(r.definition.result, r.value);
    }
  }

  const pp = byResultKey.get(RESULT_KEY.pp);
  const ppbm = byResultKey.get(RESULT_KEY.ppbm);
  const ci = byResultKey.get(RESULT_KEY.ci);
  const brfd = byResultKey.get(RESULT_KEY.brfd);
  const mrsiRaw = byResultKey.get(RESULT_KEY.mrsi);

  if (pp === undefined || ppbm === undefined || ci === undefined || brfd === undefined || mrsiRaw === undefined) {
    return null;
  }

  return { pp, ppbm, ci, brfd, mrsi: mrsiRaw / 100 };
}

/** Normalizes a name for matching: case, whitespace, punctuation-insensitive. */
const COMBINING_MARKS = /[̀-ͯ]/g;

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
