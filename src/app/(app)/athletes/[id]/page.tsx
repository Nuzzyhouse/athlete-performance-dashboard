import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getAthleteDetail } from "@/lib/data/roster";
import { AthleteHeader } from "@/components/athlete/athlete-header";
import { PredictionPanel } from "@/components/athlete/prediction-panel";
import { MetricGrid } from "@/components/athlete/metric-grid";
import { MovementPanel } from "@/components/athlete/movement-panel";
import { TestHistory } from "@/components/athlete/test-history";
import { AddTestForm } from "@/components/athlete/add-test-form";
import { clubTodayISO, daysBetweenISO, toClubISODate } from "@/lib/dates";
import { RETEST_WINDOW_DAYS } from "@/lib/constants";
import { isEditorRole } from "@/lib/roles";

export default async function AthleteProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [session, detail] = await Promise.all([auth(), getAthleteDetail(id)]);

  if (!detail || !detail.analytics) {
    notFound();
  }

  const { athlete, analytics, excludedFromFit } = detail;
  const isOwner = isEditorRole(session?.user?.role ?? "");

  const newestForcePlateTestDate =
    athlete.tests.filter((t) => t.isForcePlate).sort((a, b) => b.date.getTime() - a.date.getTime())[0]
      ?.date ?? null;
  const retestOverdueDays = newestForcePlateTestDate
    ? daysBetweenISO(toClubISODate(newestForcePlateTestDate), clubTodayISO()) - RETEST_WINDOW_DAYS
    : null;

  return (
    <div>
      <AthleteHeader
        athleteId={athlete.id}
        name={athlete.name}
        level={athlete.level}
        archived={athlete.archived}
        predOverride={athlete.predOverride}
        newestForcePlateTestDate={newestForcePlateTestDate}
        retestOverdueDays={retestOverdueDays}
        isOwner={isOwner}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <PredictionPanel mph={athlete.mph} analytics={analytics} excludedFromFit={excludedFromFit} />

        <div>
          <h2 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.75rem" }}>
            Force-plate metrics (personal bests)
          </h2>
          <MetricGrid
            values={{
              pp: athlete.pp,
              ppbm: athlete.ppbm,
              ci: athlete.ci,
              brfd: athlete.brfd,
              mrsi: athlete.mrsi,
              mph: athlete.mph,
            }}
            ranks={analytics.ranks}
          />
        </div>

        <MovementPanel athleteId={athlete.id} isa={athlete.isa} rom={athlete.rom} isOwner={isOwner} />

        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.9rem",
            }}
          >
            <h2 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Test history</h2>
            {isOwner && <AddTestForm athleteId={athlete.id} />}
          </div>
          <TestHistory tests={athlete.tests} isOwner={isOwner} />
        </div>
      </div>
    </div>
  );
}
