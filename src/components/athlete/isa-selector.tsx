"use client";

import { useTransition } from "react";
import { updateAthleteFieldsAction } from "@/lib/actions/athletes";

const OPTIONS = ["None", "Narrow", "Wide"];

export function IsaSelector({ athleteId, isa }: { athleteId: string; isa: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={isa}
      disabled={pending}
      onChange={(e) => startTransition(() => updateAthleteFieldsAction(athleteId, { isa: e.target.value }))}
      style={{ fontSize: "0.82rem" }}
    >
      {OPTIONS.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
