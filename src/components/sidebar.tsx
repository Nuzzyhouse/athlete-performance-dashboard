"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { isEditorRole } from "@/lib/roles";

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

  const items = [
    ...NAV_ITEMS,
    ...(isEditorRole(role) ? [{ href: "/sync", label: "Sync" }] : []),
    ...(role === "owner" ? [{ href: "/users", label: "Users" }] : []),
  ];

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
      <div style={{ marginBottom: "1.75rem" }}>
        <div
          style={{
            background: "#ffffff",
            borderRadius: 8,
            padding: "0.6rem 0.7rem",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/x3-logo.gif"
            alt="X3 Performance and Physical Therapy"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </div>
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
