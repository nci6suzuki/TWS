import Link from "next/link";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseServerDbClient } from "@/lib/supabase/server-db";

export default async function DashboardPage() {
  await requireAuth();
  const supabase = await createSupabaseServerDbClient();

  const today = new Date().toISOString().slice(0, 10);

  // 未完了イベント数
  const { count: pendingCount, error: pendingErr } = await supabase
    .from("employee_annual_events")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  // 期限超過（今日より前 & pending）
  const { count: overdueCount, error: overdueErr } = await supabase
    .from("employee_annual_events")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending")
    .lt("scheduled_date", today);

  // 万一エラーでも落とさず表示（0扱い）
  const pending = pendingErr ? 0 : pendingCount ?? 0;
  const overdue = overdueErr ? 0 : overdueCount ?? 0;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-6">
        <div className="text-2xl font-bold">ダッシュボード</div>
        <div className="mt-2 text-sm text-slate-600">
          未完了・期限超過をすぐ確認できます。
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/annual-events?status=pending"
          className="rounded-2xl border bg-white p-5 hover:bg-slate-50"
        >
          <div className="text-xs font-semibold tracking-[0.12em] text-slate-400">
            PENDING EVENTS
          </div>
          <div className="mt-2 text-4xl font-extrabold text-slate-900">{pending}</div>
          <div className="mt-2 text-sm text-slate-600">未完了の年間イベント</div>
        </Link>

        <Link
          href="/annual-events?overdue=1"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-5 hover:bg-rose-100/70"
        >
          <div className="text-xs font-semibold tracking-[0.12em] text-rose-600">
            OVERDUE
          </div>
          <div className="mt-2 text-4xl font-extrabold text-rose-700">{overdue}</div>
          <div className="mt-2 text-sm text-rose-700/80">期限超過（要対応）</div>
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