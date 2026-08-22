"use client";

import { useState } from "react";
import Link from "next/link";
import type { MoverRow } from "@/lib/data/analysis";

export function BiggestMovers({ mph, pp }: { mph: MoverRow[]; pp: MoverRow[] }) {
  const [metric, setMetric] = useState<"mph" | "pp">("mph");
  const rows = metric === "mph" ? mph : pp;
  const unit = metric === "mph" ? "mph" : "W";

  return (
    <div className="card" style={{ padding: "1.1rem 1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <h3 style={{ fontSize: "0.9rem", fontWeight: 700 }}>Biggest movers</h3>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          <button
            type="button"
            className="btn"
            style={{
              fontSize: "0.75rem",
              padding: "0.3rem 0.65rem",
              background: metric === "mph" ? "var(--accent)" : undefined,
            }}
            onClick={() => setMetric("mph")}
          >
            Velocity
          </button>
          <button
            type="button"
            className="btn"
            style={{
              fontSize: "0.75rem",
              padding: "0.3rem 0.65rem",
              background: metric === "pp" ? "var(--accent)" : undefined,
            }}
            onClick={() => setMetric("pp")}
          >
            Peak Power
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p style={{ fontSize: "0.82rem", color: "var(--text-mute)" }}>
          Need at least two tests per athlete to compute movement.
        </p>
      ) : (
        <table className="data-table" style={{ fontSize: "0.82rem" }}>
          <thead>
            <tr>
              <th>Athlete</th>
              <th>Then</th>
              <th>Now</th>
              <th>Gain</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.athleteId}>
                <td>
                  <Link href={`/athletes/${r.athleteId}`} style={{ fontWeight: 600 }}>
                    {r.athleteName}
                  </Link>
                </td>
                <td>
                  {metric === "pp" ? Math.round(r.then) : r.then} {unit}
                </td>
                <td>
                  {metric === "pp" ? Math.round(r.now) : r.now} {unit}
                </td>
                <td style={{ fontWeight: 700, color: r.gain >= 0 ? "var(--text-pri)" : "var(--red)" }}>
                  {r.gain > 0 ? "+" : ""}
                  {r.gain} {unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
