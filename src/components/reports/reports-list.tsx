"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ReportListRow } from "@/lib/data/reports";
import { CategoryTag } from "@/components/category-tag";
import type { PredictionCategory } from "@/lib/prediction";

export function ReportsList({ rows }: { rows: ReportListRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => rows.filter((r) => r.athleteName.toLowerCase().includes(query.trim().toLowerCase())),
    [rows, query],
  );

  return (
    <div>
      <input
        placeholder="Search athletes…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ marginBottom: "1rem", minWidth: 240 }}
      />
      <div className="card" style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Athlete</th>
              <th>Level</th>
              <th>Gap</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.athleteId}>
                <td style={{ fontWeight: 600 }}>{r.athleteName}</td>
                <td>{r.level}</td>
                <td style={{ color: r.gap === null ? "var(--text-mute)" : r.gap < 0 ? "var(--red)" : "var(--text-pri)", fontWeight: 700 }}>
                  {r.gap === null ? "—" : `${r.gap > 0 ? "+" : ""}${r.gap}`}
                </td>
                <td>
                  <CategoryTag category={r.category as PredictionCategory} />
                </td>
                <td>
                  <Link href={`/report-print/${r.athleteId}`} className="btn" style={{ fontSize: "0.75rem" }}>
                    View report
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
