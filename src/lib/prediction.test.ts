import { describe, expect, it } from "vitest";
import { computeAnalytics, type AthleteInput } from "./prediction";

function athlete(overrides: Partial<AthleteInput> & { id: string }): AthleteInput {
  return {
    name: overrides.id,
    level: "D1",
    pp: 0,
    ppbm: 0,
    ci: 0,
    brfd: 0,
    mrsi: 0,
    mph: 0,
    predOverride: null,
    ...overrides,
  };
}

// A hand-built, deterministic roster covering every branch: a normal fit-set spread
// across two levels, one genuine outlier, a manual override, an athlete tested but
// with no measured performance yet, and an athlete with no force-plate test at all.
const KNOWN_ROSTER: AthleteInput[] = [
  athlete({ id: "a1", level: "D1", pp: 5200, ppbm: 62, ci: 210, brfd: 4800, mrsi: 0.42, mph: 88 }),
  athlete({ id: "a2", level: "D1", pp: 5400, ppbm: 64, ci: 220, brfd: 4900, mrsi: 0.44, mph: 90 }),
  athlete({ id: "a3", level: "D1", pp: 5600, ppbm: 66, ci: 230, brfd: 5000, mrsi: 0.46, mph: 91 }),
  athlete({ id: "a4", level: "D1", pp: 5100, ppbm: 61, ci: 205, brfd: 4750, mrsi: 0.41, mph: 86 }),
  athlete({ id: "a5", level: "D2", pp: 4800, ppbm: 58, ci: 195, brfd: 4500, mrsi: 0.39, mph: 84 }),
  athlete({ id: "a6", level: "D2", pp: 4950, ppbm: 59, ci: 200, brfd: 4600, mrsi: 0.40, mph: 85 }),
  athlete({ id: "a7", level: "D2", pp: 4700, ppbm: 57, ci: 190, brfd: 4400, mrsi: 0.38, mph: 82 }),
  athlete({ id: "a8", level: "D2", pp: 5000, ppbm: 60, ci: 202, brfd: 4650, mrsi: 0.41, mph: 87 }),
  athlete({ id: "a9", level: "Pro", pp: 6100, ppbm: 71, ci: 260, brfd: 5400, mrsi: 0.50, mph: 96 }),
  athlete({ id: "a10", level: "Pro", pp: 5900, ppbm: 69, ci: 250, brfd: 5300, mrsi: 0.49, mph: 94 }),
  // Genuine outlier: far below everyone else on both performance and peak power.
  athlete({ id: "a11", level: "JUCO", pp: 2200, ppbm: 30, ci: 90, brfd: 2100, mrsi: 0.20, mph: 60 }),
  athlete({ id: "a12", level: "D1", pp: 5300, ppbm: 63, ci: 215, brfd: 4850, mrsi: 0.43, mph: 89 }),
  // Manual override beats the model.
  athlete({ id: "a13", level: "D1", pp: 5250, ppbm: 62.5, ci: 212, brfd: 4820, mrsi: 0.425, mph: 89, predOverride: 89.5 }),
  // Tested on the plate, but no measured performance yet.
  athlete({ id: "a14", level: "D2", pp: 4850, ppbm: 58.5, ci: 197, brfd: 4550, mrsi: 0.395, mph: 0 }),
  // Never force-plate tested.
  athlete({ id: "a15", level: "High School", pp: 0, ppbm: 0, ci: 0, brfd: 0, mrsi: 0, mph: 78 }),
];

describe("computeAnalytics", () => {
  it("matches the pinned snapshot for a known roster", () => {
    expect(computeAnalytics(KNOWN_ROSTER)).toMatchSnapshot();
  });

  it("never lets NaN reach the output", () => {
    const result = computeAnalytics(KNOWN_ROSTER);
    for (const a of Object.values(result.athletes)) {
      expect(Number.isNaN(a.pred)).toBe(false);
      expect(Number.isNaN(a.gap)).toBe(false);
      for (const r of Object.values(a.ranks)) {
        expect(Number.isNaN(r.rank)).toBe(false);
        expect(Number.isNaN(r.percentile)).toBe(false);
      }
    }
  });

  it("returns insufficient-data for an empty roster", () => {
    const result = computeAnalytics([]);
    expect(result.insufficientData).toBe(true);
    expect(result.athletes).toEqual({});
  });

  it("returns insufficient-data for a single athlete", () => {
    const result = computeAnalytics([
      athlete({ id: "solo", pp: 5000, ppbm: 60, ci: 200, mph: 88 }),
    ]);
    expect(result.insufficientData).toBe(true);
    expect(result.athletes.solo.category).toBe("insufficient-data");
    expect(result.athletes.solo.pred).toBeNull();
    expect(result.athletes.solo.gap).toBeNull();
  });

  it("returns insufficient-data when every candidate shares one identical value (zero denominator)", () => {
    const roster = [
      athlete({ id: "b1", pp: 5000, ppbm: 60, ci: 200, mph: 88 }),
      athlete({ id: "b2", pp: 5000, ppbm: 62, ci: 210, mph: 90 }),
      athlete({ id: "b3", pp: 5000, ppbm: 64, ci: 220, mph: 92 }),
    ];
    const result = computeAnalytics(roster);
    expect(result.insufficientData).toBe(true);
  });

  it("gives awaiting-data (no pred, no gap) to an athlete with no force-plate test", () => {
    const result = computeAnalytics(KNOWN_ROSTER);
    const a15 = result.athletes.a15;
    expect(a15.category).toBe("awaiting-data");
    expect(a15.pred).toBeNull();
    expect(a15.gap).toBeNull();
  });

  it("gives awaiting-performance (has pred, no gap) to a tested athlete with no measured KPI", () => {
    const result = computeAnalytics(KNOWN_ROSTER);
    const a14 = result.athletes.a14;
    expect(a14.category).toBe("awaiting-performance");
    expect(a14.pred).not.toBeNull();
    expect(a14.gap).toBeNull();
  });

  it("lets a manual override win over the regression", () => {
    const result = computeAnalytics(KNOWN_ROSTER);
    const a13 = result.athletes.a13;
    expect(a13.model).toBe("manual");
    expect(a13.pred).toBe(89.5);
  });

  it("never ranks or flags an unmeasured (zero) metric", () => {
    const result = computeAnalytics(KNOWN_ROSTER);
    const a15 = result.athletes.a15; // pp = 0
    expect(a15.ranks.pp).toEqual({ rank: null, percentile: null, flagged: false });
  });

  it("never flags a bottom-quartile warning on an athlete's zero (unmeasured) metrics", () => {
    const result = computeAnalytics(KNOWN_ROSTER);
    for (const a of KNOWN_ROSTER) {
      const out = result.athletes[a.id];
      for (const metric of ["pp", "ppbm", "ci", "mph", "brfd", "mrsi"] as const) {
        if (a[metric] <= 0) {
          expect(out.ranks[metric].flagged).toBe(false);
        }
      }
    }
  });
});
