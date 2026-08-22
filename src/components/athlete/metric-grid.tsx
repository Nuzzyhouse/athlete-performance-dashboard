import type { AthleteAnalytics, MetricKey } from "@/lib/prediction";
import { METRIC_LABELS } from "@/lib/constants";

const GRID_METRICS: MetricKey[] = ["pp", "ppbm", "ci", "brfd", "mrsi"];

export function MetricGrid({
  values,
  ranks,
}: {
  values: Record<MetricKey, number>;
  ranks: AthleteAnalytics["ranks"];
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: "0.75rem",
      }}
    >
      {GRID_METRICS.map((metric) => {
        const meta = METRIC_LABELS[metric];
        const value = values[metric];
        const rank = ranks[metric];
        const measured = value > 0;

        return (
          <div
            key={metric}
            className="card"
            style={{
              padding: "0.85rem 1rem",
              borderColor: rank.flagged ? "var(--red-border)" : undefined,
            }}
          >
            <div style={{ fontSize: "0.72rem", color: "var(--text-mute)", marginBottom: "0.3rem" }}>
              {meta.label}
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>
              {measured ? (metric === "mrsi" ? value.toFixed(2) : Math.round(value)) : "—"}
              {measured && meta.unit && (
                <span style={{ fontSize: "0.75rem", color: "var(--text-mute)" }}> {meta.unit}</span>
              )}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-mute)", marginTop: "0.15rem" }}>
              {measured && rank.rank !== null
                ? `Rank #${rank.rank} · ${rank.percentile}th pct`
                : "Not measured"}
            </div>
            {rank.flagged && (
              <span className="tag tag-red" style={{ marginTop: "0.4rem" }}>
                Bottom quartile
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
