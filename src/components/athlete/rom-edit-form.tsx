"use client";

import { useState, useTransition } from "react";
import { updateRomAction } from "@/lib/actions/athletes";
import { ROM_JOINTS, type RomData, type RomFlag } from "@/lib/types/rom";

export function RomEditForm({ athleteId, rom }: { athleteId: string; rom: RomData | null }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button type="button" className="btn" style={{ fontSize: "0.78rem" }} onClick={() => setOpen(true)}>
        Edit ROM assessment
      </button>
    );
  }

  return (
    <form
      className="card"
      style={{ padding: "1rem 1.1rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const tests: RomData["tests"] = {};
        for (const joint of ROM_JOINTS) {
          const l = Number(fd.get(`${joint.key}_l`) ?? 0);
          const r = Number(fd.get(`${joint.key}_r`) ?? 0);
          const flag = String(fd.get(`${joint.key}_flag`) ?? "") as RomFlag | "";
          if (l > 0 || r > 0) {
            tests[joint.key] = { l, r, ...(flag ? { flag } : {}) };
          }
        }
        const newRom: RomData = { date: new Date().toISOString().slice(0, 10), tests };
        startTransition(async () => {
          await updateRomAction(athleteId, newRom);
          setOpen(false);
        });
      }}
    >
      {ROM_JOINTS.map((joint) => {
        const existing = rom?.tests[joint.key];
        return (
          <div key={joint.key} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
            <span style={{ width: 140, fontSize: "0.8rem" }}>{joint.label}</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
              <label style={{ fontSize: "0.7rem" }}>L</label>
              <input
                name={`${joint.key}_l`}
                type="number"
                defaultValue={existing?.l ?? ""}
                style={{ width: 70 }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
              <label style={{ fontSize: "0.7rem" }}>R</label>
              <input
                name={`${joint.key}_r`}
                type="number"
                defaultValue={existing?.r ?? ""}
                style={{ width: 70 }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
              <label style={{ fontSize: "0.7rem" }}>Flag</label>
              <select name={`${joint.key}_flag`} defaultValue={existing?.flag ?? ""} style={{ width: 100 }}>
                <option value="">—</option>
                <option value="good">Good</option>
                <option value="warning">Warning</option>
                <option value="red">Red</option>
              </select>
            </div>
          </div>
        );
      })}
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem" }}>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save assessment"}
        </button>
        <button type="button" className="btn" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}
