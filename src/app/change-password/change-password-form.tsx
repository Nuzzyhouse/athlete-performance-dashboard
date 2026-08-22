"use client";

import { useActionState } from "react";
import { changePasswordAction } from "./actions";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, undefined);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        <label htmlFor="newPassword">New password</label>
        <input id="newPassword" name="newPassword" type="password" required minLength={8} autoFocus />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        <label htmlFor="confirmPassword">Confirm password</label>
        <input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} />
      </div>
      {state?.error && <p style={{ color: "var(--red)", fontSize: "0.8rem" }}>{state.error}</p>}
      <button type="submit" className="btn btn-primary" disabled={pending} style={{ marginTop: "0.4rem" }}>
        {pending ? "Saving…" : "Save password"}
      </button>
    </form>
  );
}
