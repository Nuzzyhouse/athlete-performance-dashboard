import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getDashboardData } from "@/lib/data/dashboard";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { NeedsConversation } from "@/components/dashboard/needs-conversation";
import { DueToRetest } from "@/components/dashboard/due-to-retest";
import { SyncBanner } from "@/components/dashboard/sync-banner";

export default async function DashboardPage() {
  const session = await auth();
  const firstName = (session?.user?.name ?? "Coach").split(" ")[0];

  const [data, syncState] = await Promise.all([
    getDashboardData(),
    prisma.syncState.findUnique({ where: { id: "vald" } }),
  ]);

  const unmatched = Array.isArray(syncState?.unmatched) ? syncState.unmatched : [];

  return (
    <div>
      <div
        style={{
          borderBottom: "2px solid var(--accent)",
          paddingBottom: "0.9rem",
          marginBottom: "1.5rem",
        }}
      >
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700 }}>Hello, {firstName}</h1>
      </div>

      <SyncBanner unmatchedCount={unmatched.length} isOwner={session?.user?.role === "owner"} />

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <RecentActivity sessions={data.recentActivity} />
        <NeedsConversation rows={data.needsConversation} />
        <DueToRetest rows={data.dueToRetest} />
      </div>
    </div>
  );
}
