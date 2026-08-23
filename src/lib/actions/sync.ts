"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getTenant, isValdConfigured } from "@/lib/vald/client";
import {
  buildSyncPreview,
  importMatches,
  dismissUnmatched,
  listDismissed,
  undismiss,
  type PreviewMatch,
} from "@/lib/vald/sync";

export async function testConnectionAction(): Promise<{ ok: boolean; message: string }> {
  await requireOwner();

  if (!isValdConfigured()) {
    return { ok: false, message: "VALD_CLIENT_ID / VALD_CLIENT_SECRET are not set in your environment." };
  }
  try {
    const tenant = await getTenant();
    return { ok: true, message: `Connected — tenant "${tenant.name}" (${tenant.id}).` };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Connection failed." };
  }
}

export async function previewSyncAction(sinceDays: number) {
  await requireOwner();
  const since = new Date(Date.now() - sinceDays * 86_400_000).toISOString();
  return buildSyncPreview(since);
}

export async function confirmImportAction(matches: PreviewMatch[], unmatchedNames: string[]) {
  await requireOwner();
  const imported = await importMatches(matches);

  await prisma.syncState.upsert({
    where: { id: "vald" },
    update: { lastRunAt: new Date(), imported, unmatched: unmatchedNames },
    create: { id: "vald", lastRunAt: new Date(), imported, unmatched: unmatchedNames },
  });

  revalidatePath("/");
  revalidatePath("/roster");
  revalidatePath("/analysis");
  revalidatePath("/sync");
  return { imported };
}

export async function dismissUnmatchedAction(valdTestId: string, profileName: string) {
  await requireOwner();
  await dismissUnmatched(valdTestId, profileName);
  revalidatePath("/sync");
}

export async function listDismissedAction() {
  await requireOwner();
  return listDismissed();
}

export async function undismissAction(valdTestId: string) {
  await requireOwner();
  await undismiss(valdTestId);
  revalidatePath("/sync");
}
