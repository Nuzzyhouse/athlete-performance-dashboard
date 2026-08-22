import { auth } from "@/auth";
import { getFullRoster } from "@/lib/data/roster";
import { computeAnalytics } from "@/lib/prediction";
import { RosterPageClient } from "@/components/roster/roster-page-client";
import type { RosterRow } from "@/components/roster/roster-table";

export default async function RosterPage() {
  const session = await auth();
  const { active, archived, result } = await getFullRoster();

  // Archived athletes are excluded from the live model — analyze them standalone
  // so the roster page can still show a (non-comparative) predicted value.
  const archivedInputs = archived.map((a) => ({
    id: a.id,
    name: a.name,
    level: a.level,
    pp: a.pp,
    ppbm: a.ppbm,
    ci: a.ci,
    brfd: a.brfd,
    mrsi: a.mrsi,
    mph: a.mph,
    predOverride: a.predOverride,
  }));
  const archivedResult = computeAnalytics(archivedInputs);

  const activeRows: RosterRow[] = active.map((a) => ({ ...a, analytics: result.athletes[a.id] }));
  const archivedRows: RosterRow[] = archived.map((a) => ({
    ...a,
    analytics: archivedResult.athletes[a.id],
  }));

  return (
    <RosterPageClient
      active={activeRows}
      archived={archivedRows}
      isOwner={session?.user?.role === "owner"}
    />
  );
}
