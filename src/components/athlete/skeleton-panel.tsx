"use client";

import { ROM_JOINTS, type RomData } from "@/lib/types/rom";

const FLAG_COLOR: Record<string, string> = {
  good: "var(--text-pri)",
  warning: "var(--red-dim)",
  red: "var(--red)",
};

/** Worse side lights the flag for a bilateral joint — near-equal sides both flag. */
function sideFlag(entry: { l: number; r: number; flag?: string } | undefined, side: "l" | "r") {
  if (!entry) return undefined;
  if (!entry.flag || entry.flag === "good") return entry.flag;
  const diff = Math.abs(entry.l - entry.r);
  const worseSide = entry.l < entry.r ? "l" : entry.r < entry.l ? "r" : null;
  if (diff <= 3 || worseSide === null) return entry.flag; // near-equal: both flag
  return side === worseSide ? entry.flag : undefined;
}

export function SkeletonPanel({ rom }: { rom: RomData | null }) {
  return (
    <svg width={200} height={380} viewBox="0 0 200 380">
      <circle cx={100} cy={30} r={18} fill="none" stroke="var(--border)" strokeWidth={2} />
      <line x1={100} y1={48} x2={100} y2={230} stroke="var(--border)" strokeWidth={2} />
      <line x1={60} y1={70} x2={140} y2={70} stroke="var(--border)" strokeWidth={2} />
      <line x1={60} y1={70} x2={45} y2={160} stroke="var(--border)" strokeWidth={2} />
      <line x1={140} y1={70} x2={155} y2={160} stroke="var(--border)" strokeWidth={2} />
      <line x1={100} y1={230} x2={70} y2={340} stroke="var(--border)" strokeWidth={2} />
      <line x1={100} y1={230} x2={130} y2={340} stroke="var(--border)" strokeWidth={2} />

      {ROM_JOINTS.map((joint) =>
        (["l", "r"] as const).map((side) => {
          const entry = rom?.tests[joint.key];
          const flag = sideFlag(entry, side);
          const x = side === "l" ? joint.x - 30 : joint.x + 30;
          const value = entry ? (side === "l" ? entry.l : entry.r) : null;
          return (
            <circle
              key={`${joint.key}-${side}`}
              cx={x}
              cy={joint.y}
              r={6}
              fill={flag ? FLAG_COLOR[flag] : "var(--card2)"}
              stroke="var(--text-mute)"
              strokeWidth={1}
            >
              <title>{`${joint.label} (${side === "l" ? "Left" : "Right"}): ${value ?? "not assessed"}${entry?.note ? ` — ${entry.note}` : ""}`}</title>
            </circle>
          );
        }),
      )}
    </svg>
  );
}
