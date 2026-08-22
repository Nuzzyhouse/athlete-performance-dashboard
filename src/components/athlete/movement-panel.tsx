import { SkeletonPanel } from "@/components/athlete/skeleton-panel";
import { RomEditForm } from "@/components/athlete/rom-edit-form";
import { IsaSelector } from "@/components/athlete/isa-selector";
import { ROM_JOINTS, isRomData, type RomData } from "@/lib/types/rom";
import { ISA_TENDENCIES } from "@/lib/constants/isa";

export function MovementPanel({
  athleteId,
  isa,
  rom,
  isOwner,
}: {
  athleteId: string;
  isa: string;
  rom: unknown;
  isOwner: boolean;
}) {
  const romData: RomData | null = isRomData(rom) ? rom : null;
  const tendency = ISA_TENDENCIES[isa] ?? ISA_TENDENCIES.None;

  return (
    <div className="card" style={{ padding: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Movement profile</h2>
        {isOwner ? (
          <IsaSelector athleteId={athleteId} isa={isa} />
        ) : (
          <span className="tag tag-mute">{isa}</span>
        )}
      </div>

      <p style={{ fontSize: "0.82rem", color: "var(--text-sec)", marginBottom: "0.5rem" }}>
        {tendency.summary}
      </p>
      <ul style={{ fontSize: "0.78rem", color: "var(--text-mute)", paddingLeft: "1.1rem", marginBottom: "1.25rem" }}>
        {tendency.tendencies.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>

      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "flex-start" }}>
        <SkeletonPanel rom={romData} />
        <div style={{ flex: 1, minWidth: 240 }}>
          <table className="data-table" style={{ fontSize: "0.78rem" }}>
            <thead>
              <tr>
                <th>Joint</th>
                <th>L</th>
                <th>R</th>
                <th>Flag</th>
              </tr>
            </thead>
            <tbody>
              {ROM_JOINTS.map((joint) => {
                const entry = romData?.tests[joint.key];
                return (
                  <tr key={joint.key}>
                    <td>{joint.label}</td>
                    <td>{entry?.l ?? "—"}</td>
                    <td>{entry?.r ?? "—"}</td>
                    <td>
                      {entry?.flag ? (
                        <span
                          className={`tag ${entry.flag === "red" ? "tag-red" : entry.flag === "warning" ? "tag-red-dim" : "tag-white"}`}
                        >
                          {entry.flag}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {romData?.date && (
            <p style={{ fontSize: "0.72rem", color: "var(--text-mute)", marginTop: "0.5rem" }}>
              Last assessed {romData.date}
            </p>
          )}
          {isOwner && (
            <div style={{ marginTop: "0.75rem" }}>
              <RomEditForm athleteId={athleteId} rom={romData} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
