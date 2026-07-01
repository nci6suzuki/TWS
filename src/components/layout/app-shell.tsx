// src/components/layout/app-shell.tsx

import { createSupabaseServerDbClient } from "@/lib/supabase/server-db";
import {
  DesktopAppNav,
  MobileAppNav,
  UnreadNotificationLink,
} from "@/components/layout/app-nav";

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
              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="text-sm font-extrabold text-slate-900">
                  TWS
                </div>
                <div className="mt-1 text-xs font-semibold text-slate-500">
                  Talent / Workflow System
                </div>

                <UnreadNotificationLink unreadCount={unreadCount} />
              </div>

              <DesktopAppNav unreadCount={unreadCount} />
            </div>
          </aside>

          <div className="lg:hidden">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-extrabold text-slate-900">
                    TWS
                  </div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">
                    Talent / Workflow System
                  </div>
                </div>

                <UnreadNotificationLink unreadCount={unreadCount} compact />
              </div>

              <MobileAppNav unreadCount={unreadCount} />
            </div>
          </div>

          <main className="space-y-6">{children}</main>
        </div>
      </div>
    </div>
  );
}