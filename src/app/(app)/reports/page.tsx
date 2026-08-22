import { getReportsList } from "@/lib/data/reports";
import { ReportsList } from "@/components/reports/reports-list";

export default async function ReportsPage() {
  const rows = await getReportsList();

  return (
    <div>
      <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "1.5rem" }}>Reports</h1>
      <ReportsList rows={rows} />
    </div>
  );
}
