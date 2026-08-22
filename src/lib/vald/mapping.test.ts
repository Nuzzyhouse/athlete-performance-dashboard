import { describe, expect, it } from "vitest";
import { normalizeName, mapCmjTrialsToMetrics } from "./mapping";

describe("normalizeName", () => {
  it("is case, whitespace, and punctuation insensitive", () => {
    expect(normalizeName("José O'Brien-Smith")).toBe(normalizeName("jose   o brien smith"));
    expect(normalizeName("  Jane   Doe ")).toBe("jane doe");
  });
});

describe("mapCmjTrialsToMetrics", () => {
  it("maps the 100ms concentric impulse, not the full-phase one", () => {
    const trials = [
      {
        results: [
          { limb: "Trial", definition: { result: "PEAK_TAKEOFF_POWER" }, value: 5000 },
          { limb: "Trial", definition: { result: "BODYMASS_RELATIVE_TAKEOFF_POWER" }, value: 60 },
          { limb: "Trial", definition: { result: "CONCENTRIC_IMPULSE" }, value: 400 },
          { limb: "Trial", definition: { result: "CONCENTRIC_IMPULSE_100MS" }, value: 200 },
          { limb: "Trial", definition: { result: "ECCENTRIC_BRAKING_RFD" }, value: 4500 },
          { limb: "Trial", definition: { result: "RSI_MODIFIED" }, value: 42 },
          { limb: "Left", definition: { result: "PEAK_TAKEOFF_POWER" }, value: 2400 },
        ],
      },
    ];
    const mapped = mapCmjTrialsToMetrics(trials);
    expect(mapped).toEqual({ pp: 5000, ppbm: 60, ci: 200, brfd: 4500, mrsi: 0.42 });
  });

  it("returns null when a required result is missing", () => {
    const trials = [{ results: [{ limb: "Trial", definition: { result: "PEAK_TAKEOFF_POWER" }, value: 5000 }] }];
    expect(mapCmjTrialsToMetrics(trials)).toBeNull();
  });
});
