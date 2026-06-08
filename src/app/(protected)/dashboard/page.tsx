import Link from "next/link";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseServerDbClient } from "@/lib/supabase/server-db";

export default async function DashboardPage() {
  await requireAuth();
  const supabase = await createSupabaseServerDbClient();

  const today = new Date().toISOString().slice(0, 10);

  // 未完了イベント数
  const { count: pendingCount } = await supabase
    .from("employee_annual_events")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  // 期限超過イベント数（今日より前 & pending）
  const { count: overdueCount } = await supabase
    .from("employee_annual_events")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending")
    .lt("scheduled_date", today);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-6">
        <div className="text-2xl font-bold">ダッシュボード</div>
        <div className="mt-2 text-sm text-slate-600">未完了と期限超過をすぐ確認できます。</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/annual-events?status=pending"
          className="rounded-2xl border bg-white p-5 hover:bg-slate-50"
        >
          <div className="text-xs font-semibold tracking-[0.12em] text-slate-400">PENDING EVENTS</div>
          <div className="mt-2 text-4xl font-extrabold">{pendingCount ?? 0}</div>
          <div className="mt-2 text-sm text-slate-600">未完了の年間イベント</div>
        </Link>

        <Link
          href="/annual-events?overdue=1"
          className="rounded-2xl border bg-white p-5 hover:bg-slate-50"
        >
          <div className="text-xs font-semibold tracking-[0.12em] text-slate-400">OVERDUE</div>
          <div className="mt-2 text-4xl font-extrabold text-rose-700">{overdueCount ?? 0}</div>
          <div className="mt-2 text-sm text-slate-600">期限超過（要対応）</div>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link className="rounded-2xl border bg-white p-5 hover:bg-slate-50" href="/employees">
          社員一覧
        </Link>
        <Link className="rounded-2xl border bg-white p-5 hover:bg-slate-50" href="/annual-events">
          年間イベント
        </Link>
      </div>
    </div>
  );
}