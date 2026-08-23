import { auth } from "@/auth";
import { isEditorRole } from "@/lib/roles";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not authenticated");
  }
  return session.user;
}

// Every write path (server action or route handler) must call this — hiding
// edit controls in the UI is not enforcement, this is.
export async function requireEditor() {
  const user = await requireUser();
  if (!isEditorRole(user.role)) {
    throw new Error("You don't have permission to edit data.");
  }
  return user;
}

// User-account management (create/delete/reset/change role) is reserved for the
// true owner — a manager has every other permission an owner does, but not this.
export async function requireOwner() {
  const user = await requireUser();
  if (user.role !== "owner") {
    throw new Error("Only the owner can manage user accounts.");
  }
  return user;
}
