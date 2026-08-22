"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <form
      action={formAction}
      style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}
    >
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoFocus />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required />
      </div>
      {state?.error && (
        <p style={{ color: "var(--red)", fontSize: "0.8rem" }}>{state.error}</p>
      )}
      <button type="submit" className="btn btn-primary" disabled={pending} style={{ marginTop: "0.4rem" }}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
