// Pure, dependency-free role logic — safe to import from client components
// (unlike authz.ts, which pulls in @/auth and is server-only).

// "owner" and "manager" can both edit athlete/roster/test/sync data — the only
// difference is user-account management, which is owner-only.
export function isEditorRole(role: string): boolean {
  return role === "owner" || role === "manager";
}
