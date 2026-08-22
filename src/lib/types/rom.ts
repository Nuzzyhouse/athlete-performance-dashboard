export type RomFlag = "good" | "warning" | "red";

export interface RomJointEntry {
  l: number;
  r: number;
  flag?: RomFlag;
  note?: string;
}

export interface RomData {
  date: string;
  tests: Record<string, RomJointEntry>;
}

export const ROM_JOINTS: { key: string; label: string; x: number; y: number; bilateral: boolean }[] = [
  { key: "shoulder_ir", label: "Shoulder IR", x: 100, y: 70, bilateral: true },
  { key: "shoulder_er", label: "Shoulder ER", x: 100, y: 95, bilateral: true },
  { key: "hip_ir", label: "Hip IR", x: 100, y: 200, bilateral: true },
  { key: "hip_er", label: "Hip ER", x: 100, y: 220, bilateral: true },
  { key: "knee_flex", label: "Knee Flexion", x: 100, y: 280, bilateral: true },
  { key: "ankle_df", label: "Ankle Dorsiflexion", x: 100, y: 340, bilateral: true },
];

export function isRomData(value: unknown): value is RomData {
  return !!value && typeof value === "object" && "tests" in (value as object);
}
