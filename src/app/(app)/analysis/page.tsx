import { getAnalysisData } from "@/lib/data/analysis";
import { QuadrantChart } from "@/components/analysis/quadrant-chart";
import { Leaderboards } from "@/components/analysis/leaderboards";
import { BiggestMovers } from "@/components/analysis/biggest-movers";

export default async function AnalysisPage() {
  const { quadrant, leaderboards, movers } = await getAnalysisData();

  return (
    <div>
      <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "1.5rem" }}>Analysis</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div className="card" style={{ padding: "1.25rem" }}>
          <h2 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.75rem" }}>
            Peak Power/BW vs. mRSI
          </h2>
          <QuadrantChart data={quadrant} />
        </div>

        <Leaderboards
          needsAttention={leaderboards.needsAttention}
          overperforming={leaderboards.overperforming}
        />

        <BiggestMovers mph={movers.mph} pp={movers.pp} />
      </div>
    </div>
  );
}
