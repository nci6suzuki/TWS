"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "./nav";
import { useMemo, useState } from "react";

function groupNav() {
  const map = new Map<string, typeof NAV>();
  for (const item of NAV) {
    const key = item.group;
    map.set(key, [...(map.get(key) ?? []), item] as any);
  }
  return Array.from(map.entries());
}

export function SidebarV2() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const groups = useMemo(() => groupNav(), []);

  return (
    <aside className={`hidden lg:block ${collapsed ? "w-[84px]" : "w-[280px]"} transition-all`}>
      <div className="sticky top-4 h-[calc(100vh-32px)] rounded-3xl border bg-white/60 backdrop-blur p-3">
        <div className="flex items-center justify-between px-2 py-2">
          <div className="text-sm font-bold text-slate-900">{collapsed ? "T" : "TWS"}</div>
          <button
            className="rounded-xl border bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
            onClick={() => setCollapsed((v) => !v)}
            type="button"
          >
            {collapsed ? ">" : "<"}
          </button>
        </div>

        <div className="mt-2 space-y-3">
          {groups.map(([group, items]) => (
            <div key={group}>
              {!collapsed && (
                <div className="px-3 pb-1 text-[11px] font-semibold tracking-[0.18em] text-slate-400">
                  {group.toUpperCase()}
                </div>
              )}
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
                        "flex items-center gap-2 rounded-2xl px-3 py-2 text-sm",
                        active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100",
                      ].join(" ")}
                      title={collapsed ? item.label : undefined}
                    >
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                        {/* アイコンは後で lucide-react に差し替え可 */}
                        {item.icon?.slice(0, 1)?.toUpperCase() ?? "•"}
                      </span>
                      {!collapsed && <span className="font-medium">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}