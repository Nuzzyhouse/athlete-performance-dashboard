import Link from "next/link";
import type { RetestRow } from "@/lib/data/dashboard";
import { RETEST_WINDOW_DAYS } from "@/lib/constants";

function retestLabel(row: RetestRow): { text: string; tone: "red" | "red-dim" | "mute" } {
  if (row.newestForcePlateTestDate === null) {
    return { text: "Never tested", tone: "red" };
  }
  const overdue = row.retestOverdueDays!;
  if (overdue > 0) {
    const weeks = Math.floor(overdue / 7);
    const text = weeks >= 1 ? `${weeks} week${weeks === 1 ? "" : "s"} overdue` : `${overdue}d overdue`;
    return { text, tone: "red" };
  }
  const daysLeft = -overdue;
  if (daysLeft <= 7) {
    return { text: `Due in ${daysLeft}d`, tone: "red-dim" };
  }
  return { text: `Due in ${daysLeft}d`, tone: "mute" };
}

export function DueToRetest({ rows }: { rows: RetestRow[] }) {
  const relevant = rows.filter(
    (r) => r.newestForcePlateTestDate === null || r.retestOverdueDays! > -21,
  );

  return (
    <div className="card" style={{ padding: "1.1rem 1.25rem" }}>
      <h2 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.9rem" }}>
        Due to re-test
      </h2>
      <p style={{ fontSize: "0.75rem", color: "var(--text-mute)", marginBottom: "0.75rem" }}>
        {RETEST_WINDOW_DAYS}-day window
      </p>

      {relevant.length === 0 ? (
        <p style={{ fontSize: "0.85rem", color: "var(--text-mute)" }}>Everyone is current.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
          {relevant.slice(0, 10).map((r) => {
            const { text, tone } = retestLabel(r);
            return (
              <Link
                key={r.athleteId}
                href={`/athletes/${r.athleteId}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.5rem 0.4rem",
                  borderTop: "1px solid var(--border)",
                  fontSize: "0.85rem",
                }}
              >
                <span style={{ fontWeight: 600 }}>{r.athleteName}</span>
                <span
                  className={`tag ${tone === "red" ? "tag-red" : tone === "red-dim" ? "tag-red-dim" : "tag-mute"}`}
                >
                  {text}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
