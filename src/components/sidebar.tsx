"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/roster", label: "Roster" },
  { href: "/analysis", label: "Analysis" },
  { href: "/reports", label: "Reports" },
];

export function Sidebar({
  userName,
  role,
}: {
  userName: string;
  role: string;
}) {
  const pathname = usePathname();

  const items = role === "owner" ? [...NAV_ITEMS, { href: "/sync", label: "Sync" }] : NAV_ITEMS;

  return (
    <aside
      style={{
        width: 220,
        flexShrink: 0,
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        padding: "1.25rem 0.9rem",
        height: "100dvh",
        position: "sticky",
        top: 0,
      }}
    >
      <div style={{ padding: "0 0.4rem", marginBottom: "1.75rem" }}>
        <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-pri)" }}>
          Performance
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-mute)" }}>Dashboard</div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: "0.15rem", flex: 1 }}>
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: "0.55rem 0.7rem",
                borderRadius: 7,
                fontSize: "0.875rem",
                fontWeight: active ? 600 : 500,
                color: active ? "var(--text-pri)" : "var(--text-sec)",
                background: active ? "var(--accent)" : "transparent",
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div
        style={{
          borderTop: "1px solid var(--border)",
          paddingTop: "0.9rem",
          marginTop: "0.9rem",
        }}
      >
        <div style={{ padding: "0 0.4rem", marginBottom: "0.6rem" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-pri)" }}>
            {userName}
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-mute)", textTransform: "capitalize" }}>
            {role}
          </div>
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}
