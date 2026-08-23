import { prisma } from "@/lib/prisma";
import { getTenant, getProfiles, getRecentTests, getTrials } from "@/lib/vald/client";
import { mapCmjTrialsToMetrics, normalizeName } from "@/lib/vald/mapping";

export interface PreviewMatch {
  valdTestId: string;
  profileName: string;
  athleteId: string;
  athleteName: string;
  date: string;
  metrics: { pp: number; ppbm: number; ci: number; brfd: number; mrsi: number };
}

export interface PreviewUnmatched {
  valdTestId: string;
  profileName: string;
  date: string;
}

export interface SyncPreview {
  matched: PreviewMatch[];
  unmatched: PreviewUnmatched[];
}

/**
 * Pulls recent CMJ tests from VALD, maps them, and matches them to the roster by full
 * name — but writes nothing. The Sync page always shows this before any import happens.
 */
export async function buildSyncPreview(sinceISO: string): Promise<SyncPreview> {
  const tenant = await getTenant();
  const [profiles, tests, roster, alreadyImported, dismissed] = await Promise.all([
    getProfiles(tenant.id),
    getRecentTests(tenant.id, sinceISO),
    prisma.athlete.findMany({ select: { id: true, name: true } }),
    prisma.testEntry.findMany({ where: { valdTestId: { not: null } }, select: { valdTestId: true } }),
    prisma.dismissedTest.findMany({ select: { valdTestId: true } }),
  ]);

  const importedIds = new Set(alreadyImported.map((t) => t.valdTestId));
  const dismissedIds = new Set(dismissed.map((d) => d.valdTestId));
  const profileById = new Map(profiles.map((p) => [p.profileId, p]));
  const rosterByNormalizedName = new Map(roster.map((a) => [normalizeName(a.name), a]));

  const cmjTests = tests.filter((t) => t.testType === "CMJ");

  const matched: PreviewMatch[] = [];
  const unmatched: PreviewUnmatched[] = [];

  for (const test of cmjTests) {
    if (importedIds.has(test.testId) || dismissedIds.has(test.testId)) continue;

    const profile = profileById.get(test.profileId);
    const profileName = profile ? `${profile.givenName} ${profile.familyName}`.trim() : test.profileId;

    // Check the (cheap, in-memory) roster match before the (expensive, rate-limited)
    // per-test trial fetch — a multi-year account often has far more historical
    // profiles than current roster athletes, and unmatched entries don't need metrics.
    const athlete = rosterByNormalizedName.get(normalizeName(profileName));
    if (!athlete) {
      unmatched.push({ valdTestId: test.testId, profileName, date: test.recordedDateUtc });
      continue;
    }

    const trials = await getTrials(tenant.id, test.testId);
    const metrics = mapCmjTrialsToMetrics(trials);
    if (!metrics) continue;

    matched.push({
      valdTestId: test.testId,
      profileName,
      athleteId: athlete.id,
      athleteName: athlete.name,
      date: test.recordedDateUtc,
      metrics,
    });
  }

  return { matched, unmatched };
}

/** Writes a previewed, coach-approved batch — a force-plate test always resets the
 * re-test clock and may raise PRs, but the date always comes from the test itself. */
export async function importMatches(matches: PreviewMatch[]): Promise<number> {
  let imported = 0;
  for (const m of matches) {
    const athlete = await prisma.athlete.findUnique({ where: { id: m.athleteId } });
    if (!athlete) continue;

    const date = new Date(m.date);

    await prisma.$transaction([
      prisma.testEntry.create({
        data: {
          athleteId: m.athleteId,
          date,
          isForcePlate: true,
          valdTestId: m.valdTestId,
          pp: m.metrics.pp,
          ppbm: m.metrics.ppbm,
          ci: m.metrics.ci,
          brfd: m.metrics.brfd,
          mrsi: m.metrics.mrsi,
        },
      }),
      prisma.athlete.update({
        where: { id: m.athleteId },
        data: {
          pp: Math.max(athlete.pp, m.metrics.pp),
          ppbm: Math.max(athlete.ppbm, m.metrics.ppbm),
          ci: Math.max(athlete.ci, m.metrics.ci),
          brfd: Math.max(athlete.brfd, m.metrics.brfd),
          mrsi: Math.max(athlete.mrsi, m.metrics.mrsi),
          lastTestedAt: !athlete.lastTestedAt || date > athlete.lastTestedAt ? date : athlete.lastTestedAt,
        },
      }),
    ]);
    imported++;
  }
  return imported;
}

export async function dismissUnmatched(valdTestId: string, profileName: string) {
  await prisma.dismissedTest.upsert({
    where: { valdTestId },
    update: {},
    create: { valdTestId, profileName },
  });
}
