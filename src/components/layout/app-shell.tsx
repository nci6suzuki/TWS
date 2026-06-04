// src/components/layout/app-shell.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; group?: string };

const nav: NavItem[] = [
  { href: "/dashboard", label: "ダッシュボード", group: "Main" },
  { href: "/employees", label: "社員", group: "Main" },
  { href: "/annual-events", label: "年間イベント", group: "Main" },
  { href: "/interviews", label: "面談", group: "Main" },
  { href: "/followups", label: "フォロー", group: "Main" },
  { href: "/notifications", label: "通知", group: "Main" },

  { href: "/settings/masters", label: "マスタ", group: "Settings" },
  { href: "/settings/templates", label: "テンプレート", group: "Settings" },
  { href: "/settings/audit-logs", label: "監査ログ", group: "Settings" },
];

function groupItems(items: NavItem[]) {
  const map = new Map<string, NavItem[]>();
  for (const item of items) {
    const key = item.group ?? "Other";
    map.set(key, [...(map.get(key) ?? []), item]);
  }
  return Array.from(map.entries());
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const groups = groupItems(nav);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1440px] px-4 py-4 lg:px-6 lg:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-6 space-y-4">
              <div className="rounded-2xl border bg-white p-4">
                <div className="text-sm font-semibold tracking-wide text-slate-900">TWS</div>
                <div className="mt-1 text-xs text-slate-500">Talent / Workflow System</div>
              </div>

              <nav className="rounded-2xl border bg-white p-2">
                {groups.map(([group, items]) => (
                  <div key={group} className="px-2 py-2">
                    <div className="px-2 pb-2 text-[11px] font-semibold tracking-[0.18em] text-slate-400">
                      {group.toUpperCase()}
                    </div>
                    <div className="space-y-1">
                      {items.map((item) => {
                        const active =
                          pathname === item.href ||
                          (item.href !== "/" && pathname?.startsWith(item.href + "/")) ||
                          pathname?.startsWith(item.href);

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={[
                              "block rounded-xl px-3 py-2 text-sm",
                              active
                                ? "bg-slate-900 text-white"
                                : "text-slate-700 hover:bg-slate-100",
                            ].join(" ")}
                          >
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main */}
          <main className="space-y-6">{children}</main>
        </div>
      </div>
    </div>
  );
}