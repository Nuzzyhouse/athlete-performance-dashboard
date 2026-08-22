import { formatDateMDY, relativeDay } from "@/lib/dates";
import { Sparkline } from "@/components/sparkline";
import { DeleteTestButton } from "@/components/athlete/delete-test-button";

interface TestEntryLike {
  id: string;
  date: Date;
  isForcePlate: boolean;
  mph: number;
  pp: number;
  ppbm: number;
  ci: number;
  brfd: number;
  mrsi: number;
}

export function TestHistory({
  tests,
  isOwner,
}: {
  tests: TestEntryLike[];
  isOwner: boolean;
}) {
  const ascending = [...tests].sort((a, b) => a.date.getTime() - b.date.getTime());
  const ppTrend = ascending.filter((t) => t.pp > 0).map((t) => t.pp);
  const mphTrend = ascending.filter((t) => t.mph > 0).map((t) => t.mph);

  const groups = new Map<string, TestEntryLike[]>();
  for (const t of tests) {
    const key = t.date.toISOString().slice(0, 10);
    const list = groups.get(key) ?? [];
    list.push(t);
    groups.set(key, list);
  }
  const dayKeys = [...groups.keys()].sort((a, b) => (a < b ? 1 : -1));

  if (tests.length === 0) {
    return (
      <p style={{ fontSize: "0.85rem", color: "var(--text-mute)" }}>
        No tests logged yet for this athlete.
      </p>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "2rem", marginBottom: "1.25rem" }}>
        <div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-mute)", marginBottom: "0.25rem" }}>
            Peak power trend
          </div>
          <Sparkline values={ppTrend} width={140} height={32} />
        </div>
        <div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-mute)", marginBottom: "0.25rem" }}>
            Velocity trend
          </div>
          <Sparkline values={mphTrend} width={140} height={32} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
        {dayKeys.map((key) => {
          const entries = groups.get(key)!;
          const date = entries[0].date;
          return (
            <div key={key} className="card" style={{ padding: "0.85rem 1rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.5rem",
                  fontSize: "0.8rem",
                }}
              >
                <span style={{ fontWeight: 700 }}>{formatDateMDY(date)}</span>
                <span style={{ color: "var(--text-mute)" }}>{relativeDay(date)}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                {entries.map((e) => (
                  <div
                    key={e.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "0.82rem",
                      gap: "0.75rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                      <span className={`tag ${e.isForcePlate ? "tag-mute" : "tag-white"}`}>
                        {e.isForcePlate ? "Force Plate" : "Performance"}
                      </span>
                      {e.isForcePlate && (
                        <span style={{ color: "var(--text-sec)" }}>
                          PP {Math.round(e.pp)}W · PP/BM {e.ppbm.toFixed(1)} · CI {Math.round(e.ci)}
                          N·s · BRFD {Math.round(e.brfd)}N/s · mRSI {e.mrsi.toFixed(2)}
                        </span>
                      )}
                      {e.mph > 0 && <span style={{ color: "var(--text-sec)" }}>{e.mph} mph</span>}
                    </div>
                    {isOwner && <DeleteTestButton testId={e.id} />}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
