import { auth } from "@/auth";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Not authenticated");
  }
  return session.user;
}

// Every write path (server action or route handler) must call this — hiding
// edit controls in the UI is not enforcement, this is.
export async function requireOwner() {
  const user = await requireUser();
  if (user.role !== "owner") {
    throw new Error("Only an owner can perform this action");
  }
  return user;
}
