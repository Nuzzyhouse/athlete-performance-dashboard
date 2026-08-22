import type { getFullReportData } from "@/lib/data/reports";
import { formatDateMDY } from "@/lib/dates";
import { CATEGORY_META } from "@/lib/constants";
import { ISA_TENDENCIES } from "@/lib/constants/isa";
import type { PredictionCategory } from "@/lib/prediction";

type ReportData = NonNullable<Awaited<ReturnType<typeof getFullReportData>>>;

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function sparklineSvg(values: number[], width = 120, height = 30, color = "#111111"): string {
  if (values.length < 2) return `<span style="font-size:11px;color:#8a8a8a">Not enough tests yet</span>`;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 2;
  const points = values
    .map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (width - pad * 2);
      const y = pad + (1 - (v - min) / range) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function progressChart(
  mphTrend: number[],
  mphDates: Date[],
  ppTrend: number[],
  ppDates: Date[],
): string {
  const W = 640;
  const H = 220;
  const PAD = 40;

  if (mphTrend.length < 2 && ppTrend.length < 2) {
    return `<p style="font-size:12px;color:#666666">Not enough tests yet to chart a trend.</p>`;
  }

  const allDates = [...mphDates, ...ppDates].map((d) => d.getTime());
  const minT = Math.min(...allDates);
  const maxT = Math.max(...allDates);
  const rangeT = maxT - minT || 1;

  function series(values: number[], dates: Date[], color: string): string {
    if (values.length < 2) return "";
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const points = values.map((v, i) => {
      const x = PAD + ((dates[i].getTime() - minT) / rangeT) * (W - PAD * 2);
      const y = H - PAD - ((v - min) / range) * (H - PAD * 2);
      return { x, y, v };
    });
    const line = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const labels = points
      .map(
        (p) =>
          `<text x="${p.x.toFixed(1)}" y="${(p.y - 8).toFixed(1)}" font-size="9" fill="${color}" text-anchor="middle">${p.v}</text>`,
      )
      .join("");
    const dots = points
      .map((p) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.5" fill="${color}"/>`)
      .join("");
    return `<polyline points="${line}" fill="none" stroke="${color}" stroke-width="2"/>${dots}${labels}`;
  }

  const dateAxis = [...mphDates, ...ppDates]
    .sort((a, b) => a.getTime() - b.getTime())
    .filter((_, i, arr) => i === 0 || i === arr.length - 1);
  const axisLabels = dateAxis
    .map((d) => {
      const x = PAD + ((d.getTime() - minT) / rangeT) * (W - PAD * 2);
      return `<text x="${x.toFixed(1)}" y="${H - 10}" font-size="10" fill="#666666" text-anchor="middle">${formatDateMDY(d)}</text>`;
    })
    .join("");

  return `<svg width="100%" viewBox="0 0 ${W} ${H}" style="max-width:${W}px">
    <line x1="${PAD}" y1="${H - PAD}" x2="${W - PAD}" y2="${H - PAD}" stroke="#d4d4d4"/>
    ${series(mphTrend, mphDates, "#111111")}
    ${series(ppTrend, ppDates, "#dc2626")}
    ${axisLabels}
    <text x="${PAD}" y="16" font-size="11" fill="#111111">— Velocity (mph)</text>
    <text x="${PAD + 120}" y="16" font-size="11" fill="#dc2626">— Peak Power (W)</text>
  </svg>`;
}

export function renderReportHtml(data: ReportData): string {
  const { athlete, analytics, report } = data;
  const categoryMeta = CATEGORY_META[analytics?.category as PredictionCategory] ?? {
    label: "—",
    tagClass: "",
  };
  const tendency = ISA_TENDENCIES[athlete.isa] ?? ISA_TENDENCIES.None;
  const today = formatDateMDY(new Date());

  const metricRows = report.plateMetrics
    .map((m) => {
      const changeStr =
        m.changePct === null
          ? "—"
          : `${m.changePct > 0 ? "+" : ""}${m.changePct}%`;
      const changeColor = m.changePct === null ? "#666666" : m.changePct >= 0 ? "#111111" : "#dc2626";
      return `<tr>
        <td style="padding:8px 10px;border-top:1px solid #e0e0e0;font-weight:600">${esc(m.label)}</td>
        <td style="padding:8px 10px;border-top:1px solid #e0e0e0">${m.current !== null ? (m.key === "mrsi" ? m.current.toFixed(2) : Math.round(m.current)) : "—"} ${esc(m.unit)}</td>
        <td style="padding:8px 10px;border-top:1px solid #e0e0e0;color:${changeColor};font-weight:600">${changeStr}</td>
        <td style="padding:8px 10px;border-top:1px solid #e0e0e0">${sparklineSvg(m.trend)}</td>
      </tr>`;
    })
    .join("");

  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:#111111; background:#fff; padding: 28px 36px; max-width: 760px; margin: 0 auto;">
    <div style="display:flex; justify-content:space-between; align-items:baseline; border-bottom: 3px solid #dc2626; padding-bottom: 10px; margin-bottom: 20px;">
      <div>
        <div style="font-size: 22px; font-weight: 700;">${esc(athlete.name)}</div>
        <div style="font-size: 13px; color:#666666;">${esc(athlete.level)} · Progress Report · ${today}</div>
      </div>
      <div style="font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 999px; border: 1px solid #d4d4d4;">
        ${esc(categoryMeta.label)}
      </div>
    </div>

    <div style="display:flex; gap: 36px; margin-bottom: 24px;">
      <div>
        <div style="font-size:11px;color:#666666;">Actual (best)</div>
        <div style="font-size:26px;font-weight:700;">${athlete.mph > 0 ? `${athlete.mph} mph` : "—"}</div>
      </div>
      <div>
        <div style="font-size:11px;color:#666666;">Predicted</div>
        <div style="font-size:26px;font-weight:700;">${analytics?.pred ?? "—"}${analytics?.pred ? " mph" : ""}</div>
      </div>
      <div>
        <div style="font-size:11px;color:#666666;">Gap</div>
        <div style="font-size:26px;font-weight:700; color:${
          analytics?.gap === null || analytics?.gap === undefined
            ? "#111111"
            : analytics.gap < 0
              ? "#dc2626"
              : "#111111"
        }">${analytics?.gap !== null && analytics?.gap !== undefined ? `${analytics.gap > 0 ? "+" : ""}${analytics.gap}` : "—"}</div>
      </div>
    </div>

    <div style="margin-bottom: 24px;">
      <div style="font-size:13px;font-weight:700;margin-bottom:8px;">Progress</div>
      ${progressChart(report.velocity.trend, report.velocity.trendDates, report.plateMetrics[0].trend, report.plateMetrics[0].trendDates)}
    </div>

    <div style="margin-bottom: 24px;">
      <div style="font-size:13px;font-weight:700;margin-bottom:8px;">Force-plate metrics</div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr style="background:#f0f0f0;text-align:left;">
            <th style="padding:8px 10px;">Metric</th>
            <th style="padding:8px 10px;">Current</th>
            <th style="padding:8px 10px;">Change vs baseline</th>
            <th style="padding:8px 10px;">Trend</th>
          </tr>
        </thead>
        <tbody>${metricRows}</tbody>
      </table>
      ${report.testCount < 2 ? `<p style="font-size:11px;color:#666666;margin-top:6px;">Only ${report.testCount} test on record — not enough for a trend yet.</p>` : ""}
    </div>

    <div>
      <div style="font-size:13px;font-weight:700;margin-bottom:6px;">Movement profile: ${esc(athlete.isa)}</div>
      <p style="font-size:12px;color:#333333;margin:0 0 4px 0;">${esc(tendency.summary)}</p>
      <ul style="font-size:11px;color:#666666;margin:0;padding-left:16px;">
        ${tendency.tendencies.map((t) => `<li>${esc(t)}</li>`).join("")}
      </ul>
    </div>
  </div>`;
}
