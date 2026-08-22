"use client";

import { useActionState, useEffect, useState } from "react";
import { createAthleteAction } from "@/lib/actions/athletes";
import { LEVELS } from "@/lib/constants";

export function AddAthleteForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createAthleteAction, undefined);

  useEffect(() => {
    if (state && !state.error) {
      setOpen(false);
    }
  }, [state]);

  if (!open) {
    return (
      <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
        + Add athlete
      </button>
    );
  }

  return (
    <div className="card" style={{ padding: "1.1rem 1.25rem", marginBottom: "1.25rem" }}>
      <form
        action={formAction}
        style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <label htmlFor="name">Name</label>
          <input id="name" name="name" required autoFocus />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <label htmlFor="level">Level</label>
          <select id="level" name="level" required defaultValue="">
            <option value="" disabled>
              Select…
            </option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <label htmlFor="mph">Performance (optional)</label>
          <input id="mph" name="mph" type="number" step="0.1" min="0" placeholder="0" style={{ width: 100 }} />
        </div>
        <p style={{ fontSize: "0.75rem", color: "var(--text-mute)", flexBasis: "100%" }}>
          Force-plate metrics are optional here — the athlete is added, then held out of the
          prediction model until their first real test fills them in.
        </p>
        {state?.error && <p style={{ color: "var(--red)", fontSize: "0.8rem" }}>{state.error}</p>}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Adding…" : "Add athlete"}
          </button>
          <button type="button" className="btn" onClick={() => setOpen(false)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
