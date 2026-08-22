import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValdConfigured } from "@/lib/vald/client";
import { buildSyncPreview, importMatches } from "@/lib/vald/sync";

const LOOKBACK_DAYS = 7;

export async function GET(req: NextRequest) {
  return runSync(req);
}

export async function POST(req: NextRequest) {
  return runSync(req);
}

async function runSync(req: NextRequest) {
  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`; also accept a plain
  // header for any other scheduler.
  const auth = req.headers.get("authorization");
  const plain = req.headers.get("x-cron-secret");
  const authorized =
    !!process.env.CRON_SECRET &&
    (auth === `Bearer ${process.env.CRON_SECRET}` || plain === process.env.CRON_SECRET);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isValdConfigured()) {
    return NextResponse.json({ error: "VALD is not configured" }, { status: 400 });
  }

  const since = new Date(Date.now() - LOOKBACK_DAYS * 86_400_000).toISOString();
  const preview = await buildSyncPreview(since);
  const imported = await importMatches(preview.matched);

  await prisma.syncState.upsert({
    where: { id: "vald" },
    update: { lastRunAt: new Date(), imported, unmatched: preview.unmatched.map((u) => u.profileName) },
    create: {
      id: "vald",
      lastRunAt: new Date(),
      imported,
      unmatched: preview.unmatched.map((u) => u.profileName),
    },
  });

  return NextResponse.json({ imported, unmatched: preview.unmatched.length });
}
