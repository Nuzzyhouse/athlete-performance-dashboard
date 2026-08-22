import type { PredictionCategory } from "@/lib/prediction";

export const RETEST_WINDOW_DAYS = 60;

export const LEVELS = ["Pro", "D1", "D2", "D3", "JUCO", "High School"] as const;

export const CATEGORY_META: Record<
  PredictionCategory,
  { label: string; tagClass: string }
> = {
  "high-priority": { label: "High Priority", tagClass: "tag-red" },
  moderate: { label: "Moderate", tagClass: "tag-red-dim" },
  "on-track": { label: "On Track", tagClass: "tag-white" },
  overperforming: { label: "Overperforming", tagClass: "tag-mute" },
  "awaiting-performance": { label: "Awaiting Performance", tagClass: "tag-mute" },
  "awaiting-data": { label: "Awaiting Data", tagClass: "tag-mute" },
  "insufficient-data": { label: "Insufficient Data", tagClass: "tag-mute" },
};

export const METRIC_LABELS: Record<string, { label: string; unit: string }> = {
  pp: { label: "Peak Power", unit: "W" },
  ppbm: { label: "Peak Power / BM", unit: "W/kg" },
  ci: { label: "Concentric Impulse", unit: "N·s" },
  brfd: { label: "Braking RFD", unit: "N/s" },
  mrsi: { label: "mRSI", unit: "" },
  mph: { label: "Velocity", unit: "mph" },
};
