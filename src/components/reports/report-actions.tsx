"use client";

export function ReportActions({ athleteId }: { athleteId: string }) {
  return (
    <div
      className="no-print"
      style={{
        display: "flex",
        gap: "0.6rem",
        justifyContent: "center",
        padding: "1rem",
        background: "var(--bg)",
      }}
    >
      <button type="button" className="btn" onClick={() => window.print()}>
        Print
      </button>
      <a href={`/api/reports/${athleteId}/pdf`} className="btn btn-primary">
        Download PDF
      </a>
    </div>
  );
}
