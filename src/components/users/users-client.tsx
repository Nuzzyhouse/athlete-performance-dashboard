"use client";

import { useState, useTransition } from "react";
import {
  createUserAction,
  updateUserRoleAction,
  resetPasswordAction,
  deleteUserAction,
  type UserRow,
} from "@/lib/actions/users";
import { formatDateMDY } from "@/lib/dates";

export function UsersClient({
  initialUsers,
  currentUserId,
}: {
  initialUsers: UserRow[];
  currentUserId: string;
}) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [pending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [credentialBanner, setCredentialBanner] = useState<{ email: string; tempPassword: string } | null>(
    null,
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createUserAction(undefined, fd);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.tempPassword && result.email) {
        setCredentialBanner({ email: result.email, tempPassword: result.tempPassword });
        setUsers((prev) => [
          ...prev,
          {
            id: `temp-${result.email}`,
            email: result.email!,
            name: String(fd.get("name") ?? ""),
            role: String(fd.get("role") ?? "coach"),
            mustChangePassword: true,
            createdAt: new Date(),
          },
        ]);
        setAddOpen(false);
        (e.target as HTMLFormElement).reset();
      }
    });
  }

  function handleRoleChange(userId: string, role: string) {
    setError(null);
    startTransition(async () => {
      try {
        await updateUserRoleAction(userId, role);
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update role.");
      }
    });
  }

  function handleResetPassword(userId: string, email: string) {
    setError(null);
    startTransition(async () => {
      const result = await resetPasswordAction(userId);
      setCredentialBanner({ email, tempPassword: result.tempPassword });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, mustChangePassword: true } : u)));
    });
  }

  function handleDelete(userId: string) {
    setError(null);
    startTransition(async () => {
      try {
        await deleteUserAction(userId);
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setConfirmDeleteId(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete user.");
      }
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {credentialBanner && (
        <div
          className="card"
          style={{
            padding: "0.9rem 1.1rem",
            borderColor: "var(--red-border)",
            background: "var(--red-bg)",
          }}
        >
          <p style={{ fontSize: "0.85rem", marginBottom: "0.3rem" }}>
            Temporary password for <strong>{credentialBanner.email}</strong> — share this with them
            directly, it won&apos;t be shown again. They&apos;ll be forced to set their own password
            on first login.
          </p>
          <code
            style={{
              display: "inline-block",
              fontSize: "0.95rem",
              fontWeight: 700,
              background: "var(--card2)",
              padding: "0.3rem 0.6rem",
              borderRadius: 6,
            }}
          >
            {credentialBanner.tempPassword}
          </code>
          <button
            type="button"
            className="btn"
            style={{ marginLeft: "0.75rem", fontSize: "0.72rem", padding: "0.2rem 0.5rem" }}
            onClick={() => setCredentialBanner(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {error && <p style={{ fontSize: "0.82rem", color: "var(--red)" }}>{error}</p>}

      {!addOpen ? (
        <button type="button" className="btn btn-primary" style={{ alignSelf: "flex-start" }} onClick={() => setAddOpen(true)}>
          + Add user
        </button>
      ) : (
        <form
          onSubmit={handleCreate}
          className="card"
          style={{ padding: "1rem 1.1rem", display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label htmlFor="name">Name</label>
            <input id="name" name="name" required autoFocus />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label htmlFor="role">Role</label>
            <select id="role" name="role" defaultValue="coach">
              <option value="coach">Coach (view-only)</option>
              <option value="manager">Manager (full edit, no user management)</option>
              <option value="owner">Owner (full edit + manage users)</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? "Creating…" : "Create user"}
            </button>
            <button type="button" className="btn" onClick={() => setAddOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="card" style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>
                  {u.name}
                  {u.id === currentUserId && (
                    <span className="tag tag-mute" style={{ marginLeft: "0.4rem" }}>
                      You
                    </span>
                  )}
                </td>
                <td>{u.email}</td>
                <td>
                  <select
                    value={u.role}
                    disabled={pending || u.id.startsWith("temp-")}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    style={{ fontSize: "0.8rem" }}
                  >
                    <option value="coach">Coach</option>
                    <option value="manager">Manager</option>
                    <option value="owner">Owner</option>
                  </select>
                </td>
                <td>
                  {u.mustChangePassword ? (
                    <span className="tag tag-red-dim">Pending first login</span>
                  ) : (
                    <span className="tag tag-white">Active</span>
                  )}
                </td>
                <td>{formatDateMDY(u.createdAt)}</td>
                <td>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <button
                      type="button"
                      className="btn"
                      style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem" }}
                      disabled={pending || u.id.startsWith("temp-")}
                      onClick={() => handleResetPassword(u.id, u.email)}
                    >
                      Reset password
                    </button>
                    {u.id !== currentUserId &&
                      !u.id.startsWith("temp-") &&
                      (confirmDeleteId === u.id ? (
                        <>
                          <button
                            type="button"
                            className="btn"
                            style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem", color: "var(--red)" }}
                            disabled={pending}
                            onClick={() => handleDelete(u.id)}
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            className="btn"
                            style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem" }}
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="btn"
                          style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem" }}
                          disabled={pending}
                          onClick={() => setConfirmDeleteId(u.id)}
                        >
                          Delete
                        </button>
                      ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
