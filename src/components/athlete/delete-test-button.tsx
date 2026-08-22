"use client";

import { useState, useTransition } from "react";
import { deleteTestEntryAction } from "@/lib/actions/athletes";

export function DeleteTestButton({ testId }: { testId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (confirming) {
    return (
      <div style={{ display: "flex", gap: "0.4rem" }}>
        <button
          type="button"
          className="btn"
          style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem", color: "var(--red)" }}
          disabled={pending}
          onClick={() => startTransition(() => deleteTestEntryAction(testId))}
        >
          {pending ? "Deleting…" : "Confirm delete"}
        </button>
        <button
          type="button"
          className="btn"
          style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem" }}
          onClick={() => setConfirming(false)}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="btn"
      style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem" }}
      onClick={() => setConfirming(true)}
    >
      Delete
    </button>
  );
}
