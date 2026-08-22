"use client";

import { useState } from "react";
import Link from "next/link";
import type { ConversationRow } from "@/lib/data/dashboard";
import { CategoryTag } from "@/components/category-tag";
import { Sparkline } from "@/components/sparkline";

const COLLAPSED_COUNT = 5;

export function NeedsConversation({ rows }: { rows: ConversationRow[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? rows : rows.slice(0, COLLAPSED_COUNT);

  return (
    <div className="card" style={{ padding: "1.1rem 1.25rem" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <h2 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.9rem" }}>
          Needs a conversation
        </h2>
        <span style={{ fontSize: "0.78rem", color: "var(--text-mute)" }}>{rows.length} flagged</span>
      </div>

      {rows.length === 0 ? (
        <p style={{ fontSize: "0.85rem", color: "var(--text-mute)" }}>
          Nobody is flagged right now.
        </p>
      ) : (
        <>
          <table className="data-table" style={{ fontSize: "0.82rem" }}>
            <thead>
              <tr>
                <th>Athlete</th>
                <th>Actual</th>
                <th>Predicted</th>
                <th>Gap</th>
                <th>Power trend</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.athleteId}>
                  <td>
                    <Link href={`/athletes/${r.athleteId}`} style={{ fontWeight: 600 }}>
                      {r.athleteName}
                    </Link>
                  </td>
                  <td>{r.mph} mph</td>
                  <td>{r.pred} mph</td>
                  <td style={{ color: r.gap < 0 ? "var(--red)" : "var(--text-pri)", fontWeight: 700 }}>
                    {r.gap > 0 ? "+" : ""}
                    {r.gap}
                  </td>
                  <td>
                    <Sparkline values={r.powerSparkline} />
                  </td>
                  <td>
                    <CategoryTag category={r.category} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > COLLAPSED_COUNT && (
            <button
              type="button"
              className="btn"
              onClick={() => setExpanded((e) => !e)}
              style={{ marginTop: "0.75rem", fontSize: "0.8rem" }}
            >
              {expanded ? "Show fewer" : `Show ${rows.length - COLLAPSED_COUNT} more`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
