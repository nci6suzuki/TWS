"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Me } from "@/types/api";

const navItems = [
  { href: "/employees", label: "プロフィールブック", sub: "社員データベース", icon: "👤" },
  { href: "/annual-events", label: "シートガレージ", sub: "年次イベント一覧", icon: "🗂" },
  { href: "/followups", label: "スマートレビュー", sub: "フォロー進捗", icon: "📝" },
  { href: "/dashboard", label: "ダッシュボード", sub: "お知らせ / ToDo", icon: "🏠" },
  { href: "/notifications", label: "通知", sub: "最新アナウンス", icon: "🔔" },
];

export function AppSidebar({ me }: { me: Me }) {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 290,
        background: "linear-gradient(175deg, #020617, #0f172a)",
        color: "#e2e8f0",
        padding: 24,
        borderRight: "1px solid rgba(148, 163, 184, 0.2)",
        boxShadow: "16px 0 36px rgba(2, 6, 23, 0.22)",
      }}
    >
      <div
        style={{
          borderRadius: 18,
          padding: 14,
          border: "1px solid rgba(148, 163, 184, 0.3)",
          background: "rgba(15, 23, 42, 0.45)",
        }}
      >
        <p style={{ margin: 0, fontSize: 11, letterSpacing: "0.2em", color: "#94a3b8" }}>TALENT MANAGEMENT</p>
        <p style={{ margin: "8px 0 0", fontSize: 18, fontWeight: 800, color: "#f8fafc" }}>メニュー</p>
        <p style={{ margin: "6px 0 0", fontSize: 12, color: "#cbd5e1" }}>ログイン社員: {me.employeeId}</p>
      </div>

      <nav style={{ marginTop: 20, display: "grid", gap: 8 }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                borderRadius: 14,
                padding: "12px 14px",
                textDecoration: "none",
                color: "white",
                background: isActive
                  ? "linear-gradient(120deg, #4f46e5, #0ea5e9)"
                  : "rgba(148, 163, 184, 0.1)",
                border: isActive ? "1px solid rgba(191, 219, 254, 0.65)" : "1px solid rgba(148, 163, 184, 0.18)",
                boxShadow: isActive ? "0 12px 24px rgba(79, 70, 229, 0.35)" : "none",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span>
                <span style={{ display: "block" }}>{item.label}</span>
                <span style={{ display: "block", marginTop: 2, fontSize: 11, fontWeight: 500, color: isActive ? "rgba(255,255,255,0.8)" : "#cbd5e1" }}>{item.sub}</span>
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}