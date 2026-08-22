"use client";

import { useState, useTransition } from "react";
import { addForcePlateTestAction, logPerformanceAction } from "@/lib/actions/athletes";

export function AddTestForm({ athleteId }: { athleteId: string }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"plate" | "performance">("plate");
  const [pending, startTransition] = useTransition();
  const today = new Date().toISOString().slice(0, 10);

  if (!open) {
    return (
      <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
        + Log a test
      </button>
    );
  }

  return (
    <form
      className="card"
      style={{ padding: "1rem 1.1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const date = new Date(`${String(fd.get("date"))}T12:00:00`);

        startTransition(async () => {
          if (mode === "plate") {
            await addForcePlateTestAction(athleteId, {
              date,
              pp: Number(fd.get("pp") ?? 0),
              ppbm: Number(fd.get("ppbm") ?? 0),
              ci: Number(fd.get("ci") ?? 0),
              brfd: Number(fd.get("brfd") ?? 0),
              mrsi: Number(fd.get("mrsi") ?? 0),
              mph: fd.get("mph") ? Number(fd.get("mph")) : undefined,
            });
          } else {
            await logPerformanceAction(athleteId, {
              date,
              mph: Number(fd.get("perfMph") ?? 0),
            });
          }
          setOpen(false);
        });
      }}
    >
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          type="button"
          className="btn"
          style={{ background: mode === "plate" ? "var(--accent)" : undefined, fontSize: "0.8rem" }}
          onClick={() => setMode("plate")}
        >
          Force-plate test
        </button>
        <button
          type="button"
          className="btn"
          style={{ background: mode === "performance" ? "var(--accent)" : undefined, fontSize: "0.8rem" }}
          onClick={() => setMode("performance")}
        >
          Performance only
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", maxWidth: 200 }}>
        <label htmlFor="date">Date</label>
        <input id="date" name="date" type="date" defaultValue={today} required />
      </div>

      {mode === "plate" ? (
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <Field name="pp" label="Peak Power (W)" />
          <Field name="ppbm" label="PP/BM (W/kg)" step="0.1" />
          <Field name="ci" label="Concentric Impulse (N·s)" />
          <Field name="brfd" label="Braking RFD (N/s)" />
          <Field name="mrsi" label="mRSI" step="0.01" />
          <Field name="mph" label="Velocity (optional)" step="0.1" />
        </div>
      ) : (
        <Field name="perfMph" label="Velocity (mph)" step="0.1" />
      )}

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </button>
        <button type="button" className="btn" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({ name, label, step = "1" }: { name: string; label: string; step?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} type="number" step={step} min="0" style={{ width: 150 }} />
    </div>
  );
}
