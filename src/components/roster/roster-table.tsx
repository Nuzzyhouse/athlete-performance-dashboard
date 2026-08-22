"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { RosterAthlete } from "@/lib/data/roster";
import type { AthleteAnalytics } from "@/lib/prediction";
import { CategoryTag } from "@/components/category-tag";
import { LEVELS } from "@/lib/constants";

export interface RosterRow extends RosterAthlete {
  analytics: AthleteAnalytics;
}

type SortKey = "name" | "level" | "pp" | "ppbm" | "ci" | "brfd" | "mrsi" | "mph" | "pred" | "gap";

function sortValue(row: RosterRow, key: SortKey): number | string {
  switch (key) {
    case "name":
      return row.name.toLowerCase();
    case "level":
      return row.level;
    case "pred":
      return row.analytics.pred ?? -Infinity;
    case "gap":
      return row.analytics.gap ?? -Infinity;
    default:
      return row[key];
  }
}

export function RosterTable({
  rows,
  isOwner,
}: {
  rows: RosterRow[];
  isOwner: boolean;
}) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("gap");
  const [sortDir, setSortDir] = useState<1 | -1>(1);

  const filtered = useMemo(() => {
    return rows
      .filter((r) => (level === "all" ? true : r.level === level))
      .filter((r) => r.name.toLowerCase().includes(query.trim().toLowerCase()))
      .sort((a, b) => {
        const av = sortValue(a, sortKey);
        const bv = sortValue(b, sortKey);
        if (av < bv) return -1 * sortDir;
        if (av > bv) return 1 * sortDir;
        return 0;
      });
  }, [rows, query, level, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 1 ? -1 : 1));
    } else {
      setSortKey(key);
      setSortDir(1);
    }
  }

  const awaitingFirstTest = filtered.filter((r) => r.pp <= 0);
  const tested = filtered.filter((r) => r.pp > 0);

  const headers: { key: SortKey; label: string }[] = [
    { key: "name", label: "Athlete" },
    { key: "level", label: "Level" },
    { key: "pp", label: "PP (W)" },
    { key: "ppbm", label: "PP/BM" },
    { key: "ci", label: "CI" },
    { key: "brfd", label: "BRFD" },
    { key: "mrsi", label: "mRSI" },
    { key: "mph", label: "Actual" },
    { key: "pred", label: "Predicted" },
    { key: "gap", label: "Gap" },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", alignItems: "center" }}>
        <input
          placeholder="Search athletes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ minWidth: 220 }}
        />
        <select value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="all">All levels</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <span style={{ marginLeft: "auto", fontSize: "0.8rem", color: "var(--text-mute)" }}>
          {filtered.length} athlete{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              {headers.map((h) => (
                <th
                  key={h.key}
                  onClick={() => toggleSort(h.key)}
                  style={{ cursor: "pointer", userSelect: "none" }}
                >
                  {h.label}
                  {sortKey === h.key ? (sortDir === 1 ? " ▲" : " ▼") : ""}
                </th>
              ))}
              <th>Status</th>
              {isOwner && <th></th>}
            </tr>
          </thead>
          <tbody>
            {tested.map((r) => (
              <RosterRowLine key={r.id} row={r} isOwner={isOwner} />
            ))}
          </tbody>
        </table>
      </div>

      {awaitingFirstTest.length > 0 && (
        <div style={{ marginTop: "1.5rem" }}>
          <h2 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.6rem" }}>
            Awaiting first force-plate test ({awaitingFirstTest.length})
          </h2>
          <div className="card" style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Athlete</th>
                  <th>Level</th>
                  <th>Actual</th>
                </tr>
              </thead>
              <tbody>
                {awaitingFirstTest.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link href={`/athletes/${r.id}`} style={{ fontWeight: 600 }}>
                        {r.name}
                      </Link>
                    </td>
                    <td>{r.level}</td>
                    <td>{r.mph > 0 ? `${r.mph} mph` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function RosterRowLine({ row, isOwner }: { row: RosterRow; isOwner: boolean }) {
  const { analytics } = row;
  return (
    <tr>
      <td>
        <Link href={`/athletes/${row.id}`} style={{ fontWeight: 600 }}>
          {row.name}
        </Link>
      </td>
      <td>{row.level}</td>
      <td>{Math.round(row.pp)}</td>
      <td>{row.ppbm.toFixed(1)}</td>
      <td>{Math.round(row.ci)}</td>
      <td>{Math.round(row.brfd)}</td>
      <td>{row.mrsi.toFixed(2)}</td>
      <td>{row.mph > 0 ? row.mph : "—"}</td>
      <td>{analytics.pred ?? "—"}</td>
      <td
        style={{
          fontWeight: 700,
          color:
            analytics.gap === null
              ? "var(--text-mute)"
              : analytics.gap < 0
                ? "var(--red)"
                : "var(--text-pri)",
        }}
      >
        {analytics.gap === null ? "—" : `${analytics.gap > 0 ? "+" : ""}${analytics.gap}`}
      </td>
      <td>
        <CategoryTag category={analytics.category} />
      </td>
      {isOwner && (
        <td>
          <Link href={`/athletes/${row.id}`} className="btn" style={{ fontSize: "0.75rem" }}>
            Edit
          </Link>
        </td>
      )}
    </tr>
  );
}
