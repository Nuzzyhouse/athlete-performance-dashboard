import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isValdConfigured } from "@/lib/vald/client";
import { SyncClient } from "@/components/sync/sync-client";
import { isEditorRole } from "@/lib/roles";

// A multi-year VALD backfill fetches trial data per-test, sequentially — give the
// preview/import actions this page calls the platform's max duration, not the ~10s default.
export const maxDuration = 60;

export default async function SyncPage() {
  const session = await auth();
  if (!session?.user || !isEditorRole(session.user.role)) {
    redirect("/");
  }

  const syncState = await prisma.syncState.findUnique({ where: { id: "vald" } });

  return (
    <div>
      <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "1.5rem" }}>Sync</h1>
      <SyncClient valdConfigured={isValdConfigured()} lastRunAt={syncState?.lastRunAt ?? null} />
    </div>
  );
}
