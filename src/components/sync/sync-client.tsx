"use client";

import { useState, useTransition } from "react";
import {
  testConnectionAction,
  previewSyncAction,
  confirmImportAction,
  dismissUnmatchedAction,
  listDismissedAction,
  undismissAction,
} from "@/lib/actions/sync";
import type { SyncPreview, PreviewMatch, DismissedTestRow } from "@/lib/vald/sync";
import { formatDateMDY } from "@/lib/dates";

export function SyncClient({
  valdConfigured,
  lastRunAt,
}: {
  valdConfigured: boolean;
  lastRunAt: Date | null;
}) {
  const [connResult, setConnResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [preview, setPreview] = useState<SyncPreview | null>(null);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [importResult, setImportResult] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const [sinceDays, setSinceDays] = useState(30);
  const [dismissedList, setDismissedList] = useState<DismissedTestRow[] | null>(null);
  const [dismissedQuery, setDismissedQuery] = useState("");

  function toggleExcluded(id: string) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="card" style={{ padding: "1.1rem 1.25rem" }}>
        <h2 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.6rem" }}>Connection</h2>
        <p style={{ fontSize: "0.8rem", color: "var(--text-mute)", marginBottom: "0.75rem" }}>
          {valdConfigured
            ? "VALD credentials are set in the environment."
            : "VALD_CLIENT_ID / VALD_CLIENT_SECRET are not set — add them to your environment to connect."}
          {lastRunAt && <> Last sync: {formatDateMDY(lastRunAt)}.</>}
        </p>
        <button
          type="button"
          className="btn"
          disabled={pending || !valdConfigured}
          onClick={() =>
            startTransition(async () => {
              setConnResult(await testConnectionAction());
            })
          }
        >
          {pending ? "Testing…" : "Test connection"}
        </button>
        {connResult && (
          <p style={{ marginTop: "0.6rem", fontSize: "0.8rem", color: connResult.ok ? "var(--text-pri)" : "var(--red)" }}>
            {connResult.message}
          </p>
        )}
      </div>

      <div className="card" style={{ padding: "1.1rem 1.25rem" }}>
        <h2 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.4rem" }}>Preview import</h2>
        <p style={{ fontSize: "0.75rem", color: "var(--text-mute)", marginBottom: "0.6rem" }}>
          &quot;Look back&quot; filters by when a test record was last modified in VALD, not when it
          was performed — use the 5-year option once to pull in your full history, then the
          shorter windows (or the nightly sync) for everything after that.
        </p>
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginBottom: "0.75rem" }}>
          <label style={{ fontSize: "0.8rem" }}>Look back</label>
          <select value={sinceDays} onChange={(e) => setSinceDays(Number(e.target.value))}>
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
            <option value={365}>1 year</option>
            <option value={1825}>5 years (initial backfill)</option>
          </select>
          <button
            type="button"
            className="btn btn-primary"
            disabled={pending || !valdConfigured}
            onClick={() =>
              startTransition(async () => {
                setImportResult(null);
                setExcluded(new Set());
                setPreview(await previewSyncAction(sinceDays));
              })
            }
          >
            {pending ? "Fetching…" : "Fetch preview"}
          </button>
        </div>

        {preview && (
          <div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-mute)", marginBottom: "0.6rem" }}>
              {preview.matched.length} matched · {preview.unmatched.length} unmatched. Nothing is
              written until you confirm below.
            </p>

            {preview.matched.length > 0 && (
              <table className="data-table" style={{ fontSize: "0.8rem", marginBottom: "1rem" }}>
                <thead>
                  <tr>
                    <th></th>
                    <th>Athlete</th>
                    <th>Date</th>
                    <th>PP</th>
                    <th>PP/BM</th>
                    <th>CI</th>
                    <th>BRFD</th>
                    <th>mRSI</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.matched.map((m) => (
                    <tr key={m.valdTestId} style={{ opacity: excluded.has(m.valdTestId) ? 0.4 : 1 }}>
                      <td>
                        <input
                          type="checkbox"
                          checked={!excluded.has(m.valdTestId)}
                          onChange={() => toggleExcluded(m.valdTestId)}
                        />
                      </td>
                      <td style={{ fontWeight: 600 }}>{m.athleteName}</td>
                      <td>{formatDateMDY(m.date)}</td>
                      <td>{Math.round(m.metrics.pp)}</td>
                      <td>{m.metrics.ppbm.toFixed(1)}</td>
                      <td>{Math.round(m.metrics.ci)}</td>
                      <td>{Math.round(m.metrics.brfd)}</td>
                      <td>{m.metrics.mrsi.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {preview.unmatched.length > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.4rem" }}>
                  Unmatched profiles
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  {preview.unmatched.map((u) => (
                    <div
                      key={u.valdTestId}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.8rem",
                        alignItems: "center",
                      }}
                    >
                      <span>
                        {u.profileName} — {formatDateMDY(u.date)}
                      </span>
                      <button
                        type="button"
                        className="btn"
                        style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem" }}
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await dismissUnmatchedAction(u.valdTestId, u.profileName);
                            setPreview((p) =>
                              p ? { ...p, unmatched: p.unmatched.filter((x) => x.valdTestId !== u.valdTestId) } : p,
                            );
                          })
                        }
                      >
                        Dismiss
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {preview.matched.length > 0 && (
              <button
                type="button"
                className="btn btn-primary"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const toImport: PreviewMatch[] = preview.matched.filter(
                      (m) => !excluded.has(m.valdTestId),
                    );
                    const result = await confirmImportAction(
                      toImport,
                      preview.unmatched.map((u) => u.profileName),
                    );
                    setImportResult(result.imported);
                    setPreview(null);
                  })
                }
              >
                {pending ? "Importing…" : `Import ${preview.matched.length - excluded.size} tests`}
              </button>
            )}
          </div>
        )}

        {importResult !== null && (
          <p style={{ fontSize: "0.82rem", color: "var(--text-pri)", marginTop: "0.75rem" }}>
            Imported {importResult} test{importResult === 1 ? "" : "s"}.
          </p>
        )}
      </div>

      <div className="card" style={{ padding: "1.1rem 1.25rem" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "0.6rem" }}>
          <h2 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Dismissed tests</h2>
          {dismissedList !== null && (
            <span style={{ fontSize: "0.75rem", color: "var(--text-mute)" }}>
              {dismissedList.length} total
            </span>
          )}
        </div>
        <p style={{ fontSize: "0.75rem", color: "var(--text-mute)", marginBottom: "0.6rem" }}>
          Dismissing a test only removes it from this app's import queue — nothing in VALD is
          touched. Undoing here makes it eligible to show up as unmatched again next preview.
        </p>

        {dismissedList === null ? (
          <button
            type="button"
            className="btn"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                setDismissedList(await listDismissedAction());
              })
            }
          >
            {pending ? "Loading…" : "Show dismissed tests"}
          </button>
        ) : dismissedList.length === 0 ? (
          <p style={{ fontSize: "0.82rem", color: "var(--text-mute)" }}>Nothing dismissed yet.</p>
        ) : (
          <div>
            <input
              placeholder="Search by name…"
              value={dismissedQuery}
              onChange={(e) => setDismissedQuery(e.target.value)}
              style={{ marginBottom: "0.75rem", minWidth: 220 }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", maxHeight: 400, overflowY: "auto" }}>
              {dismissedList
                .filter((d) => d.profileName.toLowerCase().includes(dismissedQuery.trim().toLowerCase()))
                .map((d) => (
                  <div
                    key={d.valdTestId}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "0.8rem",
                    }}
                  >
                    <span>
                      {d.profileName} — dismissed {formatDateMDY(d.dismissedAt)}
                    </span>
                    <button
                      type="button"
                      className="btn"
                      style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem" }}
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await undismissAction(d.valdTestId);
                          setDismissedList((list) =>
                            list ? list.filter((x) => x.valdTestId !== d.valdTestId) : list,
                          );
                        })
                      }
                    >
                      Undo
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
