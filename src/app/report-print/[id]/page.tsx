import { notFound } from "next/navigation";
import { getFullReportData } from "@/lib/data/reports";
import { renderReportHtml } from "@/lib/reports/render-html";
import { ReportActions } from "@/components/reports/report-actions";

export default async function ReportPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getFullReportData(id);
  if (!data || !data.analytics) notFound();

  const html = renderReportHtml(data);

  return (
    <div>
      <ReportActions athleteId={id} />
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
