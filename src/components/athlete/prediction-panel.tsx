import type { AthleteAnalytics } from "@/lib/prediction";
import { CategoryTag } from "@/components/category-tag";

export function PredictionPanel({
  mph,
  analytics,
  excludedFromFit,
}: {
  mph: number;
  analytics: AthleteAnalytics;
  excludedFromFit: boolean;
}) {
  const { pred, gap, category, model, offset } = analytics;

  return (
    <div className="card" style={{ padding: "1.25rem" }}>
      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
        <Stat label="Actual" value={mph > 0 ? `${mph}` : "—"} />
        <Stat label="Predicted" value={pred !== null ? `${pred}` : "—"} />
        <Stat
          label="Gap"
          value={gap !== null ? `${gap > 0 ? "+" : ""}${gap}` : "—"}
          color={gap === null ? undefined : gap < 0 ? "var(--red)" : "var(--text-pri)"}
        />
        <div style={{ display: "flex", alignItems: "center" }}>
          <CategoryTag category={category} />
        </div>
      </div>

      <div
        style={{
          marginTop: "1rem",
          paddingTop: "0.85rem",
          borderTop: "1px solid var(--border)",
          fontSize: "0.78rem",
          color: "var(--text-mute)",
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
        }}
      >
        {model === "manual" && <span>Prediction set manually — overrides the regression model.</span>}
        {model === "regression" && offset !== null && (
          <span>
            Regression model, re-centered {offset >= 0 ? "+" : ""}
            {offset.toFixed(2)} mph for this athlete&apos;s level.
          </span>
        )}
        {category === "awaiting-data" && (
          <span>No force-plate test on record yet — held out of the prediction model.</span>
        )}
        {category === "awaiting-performance" && (
          <span>Tested, but no measured performance logged yet — gap can&apos;t be computed.</span>
        )}
        {category === "insufficient-data" && (
          <span>Not enough roster data yet to fit a prediction model.</span>
        )}
        {excludedFromFit && (
          <span style={{ color: "var(--red-dim)" }}>
            Held out of the regression fit as a statistical outlier — still predicted and ranked
            normally.
          </span>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: "0.75rem", color: "var(--text-mute)", marginBottom: "0.2rem" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.6rem", fontWeight: 700, color: color ?? "var(--text-pri)" }}>
        {value}
        {value !== "—" && <span style={{ fontSize: "0.9rem", color: "var(--text-mute)" }}> mph</span>}
      </div>
    </div>
  );
}
