"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { archiveAthleteAction, updateAthleteFieldsAction } from "@/lib/actions/athletes";
import { LEVELS } from "@/lib/constants";
import { formatDateMDY } from "@/lib/dates";

export function AthleteHeader({
  athleteId,
  name,
  level,
  archived,
  predOverride,
  newestForcePlateTestDate,
  retestOverdueDays,
  isOwner,
}: {
  athleteId: string;
  name: string;
  level: string;
  archived: boolean;
  predOverride: number | null;
  newestForcePlateTestDate: Date | null;
  retestOverdueDays: number | null;
  isOwner: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [overrideOpen, setOverrideOpen] = useState(false);

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            {name}
            {archived && <span className="tag tag-mute" style={{ marginLeft: "0.6rem" }}>Archived</span>}
          </h1>
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginTop: "0.35rem" }}>
            {isOwner ? (
              <select
                value={level}
                disabled={pending}
                onChange={(e) =>
                  startTransition(() => updateAthleteFieldsAction(athleteId, { level: e.target.value }))
                }
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            ) : (
              <span style={{ color: "var(--text-sec)" }}>{level}</span>
            )}
            <span style={{ fontSize: "0.78rem", color: "var(--text-mute)" }}>
              {newestForcePlateTestDate
                ? `Last tested ${formatDateMDY(newestForcePlateTestDate)}${
                    retestOverdueDays !== null && retestOverdueDays > 0
                      ? ` — ${retestOverdueDays}d overdue`
                      : ""
                  }`
                : "Never force-plate tested"}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link href={`/report-print/${athleteId}`} className="btn">
            Progress report
          </Link>
          {isOwner && (
            <button
              type="button"
              className="btn"
              disabled={pending}
              onClick={() => startTransition(() => archiveAthleteAction(athleteId, !archived))}
            >
              {archived ? "Unarchive" : "Archive"}
            </button>
          )}
        </div>
      </div>

      {isOwner && (
        <div style={{ marginTop: "0.75rem" }}>
          {overrideOpen ? (
            <form
              style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const raw = fd.get("predOverride");
                const value = raw && String(raw).trim() !== "" ? Number(raw) : null;
                startTransition(async () => {
                  await updateAthleteFieldsAction(athleteId, { predOverride: value });
                  setOverrideOpen(false);
                });
              }}
            >
              <label htmlFor="predOverride" style={{ fontSize: "0.78rem" }}>
                Manual prediction override (mph)
              </label>
              <input
                id="predOverride"
                name="predOverride"
                type="number"
                step="0.1"
                defaultValue={predOverride ?? ""}
                style={{ width: 100 }}
              />
              <button type="submit" className="btn" style={{ fontSize: "0.75rem" }} disabled={pending}>
                Save
              </button>
              <button
                type="button"
                className="btn"
                style={{ fontSize: "0.75rem" }}
                onClick={() => setOverrideOpen(false)}
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              type="button"
              className="btn"
              style={{ fontSize: "0.75rem" }}
              onClick={() => setOverrideOpen(true)}
            >
              {predOverride ? `Manual override: ${predOverride} mph` : "Set manual override"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
