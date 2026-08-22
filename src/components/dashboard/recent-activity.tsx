import Link from "next/link";
import type { ActivitySession } from "@/lib/data/dashboard";
import { METRIC_LABELS } from "@/lib/constants";

export function RecentActivity({ sessions }: { sessions: ActivitySession[] }) {
  return (
    <div className="card" style={{ padding: "1.1rem 1.25rem" }}>
      <h2 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.9rem" }}>
        Recent activity
      </h2>
      {sessions.length === 0 ? (
        <p style={{ fontSize: "0.85rem", color: "var(--text-mute)" }}>
          Nothing logged yet. Sync your force-plate feed or add a test to get started.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
          {sessions.slice(0, 12).map((s) => (
            <Link
              key={`${s.athleteId}-${s.date.toISOString()}`}
              href={`/athletes/${s.athleteId}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.75rem",
                padding: "0.55rem 0.4rem",
                borderTop: "1px solid var(--border)",
                fontSize: "0.85rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                <span style={{ fontWeight: 600, color: "var(--text-pri)" }}>{s.athleteName}</span>
                <span style={{ color: "var(--text-mute)", fontSize: "0.78rem" }}>
                  {s.hasForcePlate && s.hasPerformance
                    ? "Force-plate test + velocity logged"
                    : s.hasForcePlate
                      ? "Force-plate test synced"
                      : "Velocity logged"}
                </span>
                {s.prMetrics.length > 0 && (
                  <span className="tag tag-white">
                    PR — {s.prMetrics.map((m) => METRIC_LABELS[m]?.label ?? m).join(", ")}
                  </span>
                )}
                {s.currentlyFlagged && (
                  <span className={`tag ${s.currentlyFlagged === "high-priority" ? "tag-red" : "tag-red-dim"}`}>
                    Flagged
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                {s.mph !== null && (
                  <span style={{ color: "var(--text-sec)" }}>
                    {s.mph} mph
                    {s.mphDelta !== null && s.mphDelta !== 0 && (
                      <span style={{ color: s.mphDelta > 0 ? "var(--text-pri)" : "var(--red)" }}>
                        {" "}
                        ({s.mphDelta > 0 ? "+" : ""}
                        {s.mphDelta})
                      </span>
                    )}
                  </span>
                )}
                <span style={{ color: "var(--text-mute)", fontSize: "0.78rem", width: 80, textAlign: "right" }}>
                  {s.dateLabel}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
