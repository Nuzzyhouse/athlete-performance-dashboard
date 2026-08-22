import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { requireUser } from "@/lib/authz";
import { getFullReportData } from "@/lib/data/reports";
import { renderReportHtml } from "@/lib/reports/render-html";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();

  const { id } = await params;
  const data = await getFullReportData(id);
  if (!data || !data.analytics) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = renderReportHtml(data);
  const fullHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; }
      @page { margin: 0; }
    </style>
  </head>
  <body>${body}</body>
</html>`;

  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: "load" });
    const pdf = await page.pdf({
      printBackground: true,
      width: "820px",
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
      preferCSSPageSize: true,
    });

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${data.athlete.name.replace(/[^a-z0-9]+/gi, "-")}-progress-report.pdf"`,
      },
    });
  } finally {
    await browser.close();
  }
}
