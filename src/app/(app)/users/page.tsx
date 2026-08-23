import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listUsersAction } from "@/lib/actions/users";
import { UsersClient } from "@/components/users/users-client";

export default async function UsersPage() {
  const session = await auth();
  if (session?.user?.role !== "owner") {
    redirect("/");
  }

  const users = await listUsersAction();

  return (
    <div>
      <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "1.5rem" }}>Users</h1>
      <UsersClient initialUsers={users} currentUserId={session.user.id} />
    </div>
  );
}
