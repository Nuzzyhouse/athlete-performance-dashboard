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
  const { points, medianPp, medianMph } = data;

  if (points.length === 0) {
    return (
      <p style={{ fontSize: "0.85rem", color: "var(--text-mute)" }}>
        Not enough tested-and-measured athletes yet to plot the quadrant.
      </p>
    );
  }

  const ppVals = points.map((p) => p.pp);
  const mphVals = points.map((p) => p.mph);
  const ppMin = Math.min(...ppVals, medianPp) * 0.95;
  const ppMax = Math.max(...ppVals, medianPp) * 1.05;
  const mphMin = Math.min(...mphVals, medianMph) * 0.95;
  const mphMax = Math.max(...mphVals, medianMph) * 1.05;

  const x = (pp: number) => PAD + ((pp - ppMin) / (ppMax - ppMin)) * (WIDTH - PAD * 2);
  const y = (mph: number) => HEIGHT - PAD - ((mph - mphMin) / (mphMax - mphMin)) * (HEIGHT - PAD * 2);

  const medianX = x(medianPp);
  const medianY = y(medianMph);

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ minWidth: 560 }}>
        {/* Quadrant labels */}
        <text x={PAD + 8} y={PAD + 18} fontSize="11" fill="var(--text-mute)">
          Underexpressed — engine ahead of output
        </text>
        <text x={WIDTH - PAD - 8} y={PAD + 18} fontSize="11" fill="var(--text-mute)" textAnchor="end">
          Elite — high engine, high output
        </text>
        <text x={PAD + 8} y={HEIGHT - PAD - 8} fontSize="11" fill="var(--text-mute)">
          Developing — building the base
        </text>
        <text x={WIDTH - PAD - 8} y={HEIGHT - PAD - 8} fontSize="11" fill="var(--text-mute)" textAnchor="end">
          Overachieving — output ahead of engine
        </text>

        {/* Median split lines */}
        <line x1={medianX} y1={PAD} x2={medianX} y2={HEIGHT - PAD} stroke="var(--border)" strokeDasharray="4 4" />
        <line x1={PAD} y1={medianY} x2={WIDTH - PAD} y2={medianY} stroke="var(--border)" strokeDasharray="4 4" />

        {/* Axes */}
        <line x1={PAD} y1={HEIGHT - PAD} x2={WIDTH - PAD} y2={HEIGHT - PAD} stroke="var(--text-mute)" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={HEIGHT - PAD} stroke="var(--text-mute)" />
        <text x={WIDTH / 2} y={HEIGHT - 14} fontSize="12" fill="var(--text-sec)" textAnchor="middle">
          Peak Power (engine) →
        </text>
        <text
          x={16}
          y={HEIGHT / 2}
          fontSize="12"
          fill="var(--text-sec)"
          textAnchor="middle"
          transform={`rotate(-90, 16, ${HEIGHT / 2})`}
        >
          Velocity (expression) →
        </text>

        {points.map((p) => (
          <circle
            key={p.athleteId}
            cx={x(p.pp)}
            cy={y(p.mph)}
            r={6}
            fill={CATEGORY_COLOR[p.category] ?? "var(--text-mute)"}
            stroke="var(--bg)"
            strokeWidth={1.5}
            style={{ cursor: "pointer" }}
            onClick={() => router.push(`/athletes/${p.athleteId}`)}
          >
            <title>{`${p.athleteName} (${p.level}) — ${Math.round(p.pp)}W, ${p.mph} mph`}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
}
