import Link from "next/link";
import type { LeaderboardRow } from "@/lib/data/analysis";

function Board({ title, rows }: { title: string; rows: LeaderboardRow[] }) {
  return (
    <div className="card" style={{ padding: "1.1rem 1.25rem", flex: 1, minWidth: 300 }}>
      <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.75rem" }}>{title}</h3>
      {rows.length === 0 ? (
        <p style={{ fontSize: "0.82rem", color: "var(--text-mute)" }}>No data yet.</p>
      ) : (
        <table className="data-table" style={{ fontSize: "0.82rem" }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Athlete</th>
              <th>Actual</th>
              <th>Predicted</th>
              <th>Gap</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.athleteId}>
                <td style={{ color: "var(--text-mute)" }}>{i + 1}</td>
                <td>
                  <Link href={`/athletes/${r.athleteId}`} style={{ fontWeight: 600 }}>
                    {r.athleteName}
                  </Link>
                </td>
                <td>{r.mph}</td>
                <td>{r.pred}</td>
                <td style={{ fontWeight: 700, color: r.gap < 0 ? "var(--red)" : "var(--text-pri)" }}>
                  {r.gap > 0 ? "+" : ""}
                  {r.gap}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function Leaderboards({
  needsAttention,
  overperforming,
}: {
  needsAttention: LeaderboardRow[];
  overperforming: LeaderboardRow[];
}) {
  return (
    <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
      <Board title="Needs attention (worst gap)" rows={needsAttention} />
      <Board title="Overperforming (best gap)" rows={overperforming} />
    </div>
  );
}
