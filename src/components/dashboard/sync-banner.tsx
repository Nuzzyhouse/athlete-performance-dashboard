import Link from "next/link";

export function SyncBanner({
  unmatchedCount,
  isOwner,
}: {
  unmatchedCount: number;
  isOwner: boolean;
}) {
  if (unmatchedCount === 0) return null;

  return (
    <div
      className="card"
      style={{
        padding: "0.75rem 1.1rem",
        marginBottom: "1.25rem",
        borderColor: "var(--red-dim-border)",
        background: "var(--red-dim-bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: "0.85rem",
      }}
    >
      <span style={{ color: "var(--red-dim)" }}>
        {unmatchedCount} profile{unmatchedCount === 1 ? "" : "s"} from the last force-plate sync
        didn&apos;t match a roster name.
      </span>
      {isOwner && (
        <Link href="/sync" className="btn" style={{ fontSize: "0.78rem" }}>
          Review on Sync
        </Link>
      )}
    </div>
  );
}
