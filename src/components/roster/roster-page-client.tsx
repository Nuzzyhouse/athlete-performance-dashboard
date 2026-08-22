"use client";

import { useState } from "react";
import { RosterTable, type RosterRow } from "@/components/roster/roster-table";
import { AddAthleteForm } from "@/components/roster/add-athlete-form";

export function RosterPageClient({
  active,
  archived,
  isOwner,
}: {
  active: RosterRow[];
  archived: RosterRow[];
  isOwner: boolean;
}) {
  const [showArchived, setShowArchived] = useState(false);

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.25rem",
        }}
      >
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700 }}>Roster</h1>
        <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem" }}>
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          Show archived ({archived.length})
        </label>
      </div>

      {isOwner && (
        <div style={{ marginBottom: "1.25rem" }}>
          <AddAthleteForm />
        </div>
      )}

      <RosterTable rows={showArchived ? archived : active} isOwner={isOwner} />
    </div>
  );
}
