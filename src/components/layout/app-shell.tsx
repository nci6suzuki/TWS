// src/components/layout/app-shell.tsx

import Link from "next/link";
import { createSupabaseServerDbClient } from "@/lib/supabase/server-db";

const nav = [
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/employees", label: "社員" },
  { href: "/annual-events", label: "年間イベント" },
  { href: "/notifications", label: "通知", badgeKey: "notifications" },
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerDbClient();

  const { count: unreadNotificationCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("status", "unread");

  const unreadCount = unreadNotificationCount ?? 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1440px] px-4 py-5 lg:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-5 space-y-4">
              <div className="rounded-2xl border bg-white p-4">
                <div className="text-sm font-extrabold text-slate-900">
                  TWS
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Talent / Workflow System
                </div>

                {unreadCount > 0 && (
                  <Link
                    href="/notifications"
                    className="mt-3 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 hover:bg-rose-100"
                  >
                    <span>未読通知</span>
                    <span className="rounded-full bg-rose-600 px-2 py-0.5 text-white">
                      {unreadCount}
                    </span>
                  </Link>
                )}
              </div>

              <nav className="rounded-2xl border bg-white p-2">
                {nav.map((i) => (
                  <Link
                    key={i.href}
                    href={i.href}
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <span>{i.label}</span>

                    {i.badgeKey === "notifications" && unreadCount > 0 && (
                      <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-black text-white">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          <div className="lg:hidden">
            <div className="rounded-2xl border bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-extrabold text-slate-900">
                    TWS
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Talent / Workflow System
                  </div>
                </div>

                {unreadCount > 0 && (
                  <Link
                    href="/notifications"
                    className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-3 py-1.5 text-xs font-black text-white"
                  >
                    通知 {unreadCount}
                  </Link>
                )}
              </div>

              <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {nav.map((i) => (
                  <Link
                    key={i.href}
                    href={i.href}
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <span>{i.label}</span>

                    {i.badgeKey === "notifications" && unreadCount > 0 && (
                      <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-black text-white">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          <main className="space-y-6">{children}</main>
        </div>
      </div>
    </div>
  );
}