"use client";

import { useRouter } from "next/navigation";
import type { QuadrantData } from "@/lib/data/analysis";

const CATEGORY_COLOR: Record<string, string> = {
  "high-priority": "var(--red)",
  moderate: "var(--red-dim)",
  "on-track": "var(--text-pri)",
  overperforming: "var(--text-mute)",
};

const WIDTH = 720;
const HEIGHT = 480;
const PAD = 56;

export function QuadrantChart({ data }: { data: QuadrantData }) {
  const router = useRouter();
  const { points, medianPpbm, medianMrsi } = data;

  if (points.length === 0) {
    return (
      <p style={{ fontSize: "0.85rem", color: "var(--text-mute)" }}>
        Not enough athletes with both Peak Power/BW and mRSI yet to plot the quadrant.
      </p>
    );
  }

  const ppbmVals = points.map((p) => p.ppbm);
  const mrsiVals = points.map((p) => p.mrsi);
  const ppbmMin = Math.min(...ppbmVals, medianPpbm) * 0.95;
  const ppbmMax = Math.max(...ppbmVals, medianPpbm) * 1.05;
  const mrsiMin = Math.min(...mrsiVals, medianMrsi) * 0.95;
  const mrsiMax = Math.max(...mrsiVals, medianMrsi) * 1.05;

  const x = (ppbm: number) => PAD + ((ppbm - ppbmMin) / (ppbmMax - ppbmMin)) * (WIDTH - PAD * 2);
  const y = (mrsi: number) =>
    HEIGHT - PAD - ((mrsi - mrsiMin) / (mrsiMax - mrsiMin)) * (HEIGHT - PAD * 2);

  const medianX = x(medianPpbm);
  const medianY = y(medianMrsi);

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ minWidth: 560 }}>
        {/* Quadrant labels */}
        <text x={PAD + 8} y={PAD + 18} fontSize="11" fill="var(--text-mute)">
          Reactive, not powerful — needs strength/power work
        </text>
        <text x={WIDTH - PAD - 8} y={PAD + 18} fontSize="11" fill="var(--text-mute)" textAnchor="end">
          Elite — strong and reactive
        </text>
        <text x={PAD + 8} y={HEIGHT - PAD - 8} fontSize="11" fill="var(--text-mute)">
          Developing — building both qualities
        </text>
        <text x={WIDTH - PAD - 8} y={HEIGHT - PAD - 8} fontSize="11" fill="var(--text-mute)" textAnchor="end">
          Strong, not reactive — needs plyometric/RSI work
        </text>

        {/* Median split lines */}
        <line x1={medianX} y1={PAD} x2={medianX} y2={HEIGHT - PAD} stroke="var(--border)" strokeDasharray="4 4" />
        <line x1={PAD} y1={medianY} x2={WIDTH - PAD} y2={medianY} stroke="var(--border)" strokeDasharray="4 4" />

        {/* Axes */}
        <line x1={PAD} y1={HEIGHT - PAD} x2={WIDTH - PAD} y2={HEIGHT - PAD} stroke="var(--text-mute)" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={HEIGHT - PAD} stroke="var(--text-mute)" />
        <text x={WIDTH / 2} y={HEIGHT - 14} fontSize="12" fill="var(--text-sec)" textAnchor="middle">
          Peak Power / BW →
        </text>
        <text
          x={16}
          y={HEIGHT / 2}
          fontSize="12"
          fill="var(--text-sec)"
          textAnchor="middle"
          transform={`rotate(-90, 16, ${HEIGHT / 2})`}
        >
          mRSI →
        </text>

        {points.map((p) => (
          <circle
            key={p.athleteId}
            cx={x(p.ppbm)}
            cy={y(p.mrsi)}
            r={6}
            fill={CATEGORY_COLOR[p.category] ?? "var(--text-mute)"}
            stroke="var(--bg)"
            strokeWidth={1.5}
            style={{ cursor: "pointer" }}
            onClick={() => router.push(`/athletes/${p.athleteId}`)}
          >
            <title>{`${p.athleteName} (${p.level}) — ${p.ppbm.toFixed(1)} W/kg, ${p.mrsi.toFixed(2)} mRSI`}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
}
