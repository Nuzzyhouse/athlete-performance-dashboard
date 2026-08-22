import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div style={{ display: "flex", minHeight: "100dvh" }}>
      <Sidebar userName={session.user.name ?? session.user.email ?? "Coach"} role={session.user.role} />
      <main style={{ flex: 1, minWidth: 0, padding: "1.75rem 2rem" }}>{children}</main>
    </div>
  );
}
