"use client";

import { signOutAction } from "@/lib/actions/auth";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="btn"
        style={{ width: "100%", justifyContent: "center", fontSize: "0.8rem" }}
      >
        Sign out
      </button>
    </form>
  );
}
