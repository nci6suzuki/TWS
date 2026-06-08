import Link from "next/link";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseServerDbClient } from "@/lib/supabase/server-db";
import { AnnualEventFilters } from "@/components/annual-events/annual-event-filters";

export default async function AnnualEventsPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  await requireAuth();
  const supabase = await createSupabaseServerDbClient();

  const status = searchParams.status ?? "";
  const type = searchParams.type ?? "";
  const year = searchParams.year ?? "";
  const q = searchParams.q ?? "";
  const overdue = searchParams.overdue ?? "";

  // 今日（YYYY-MM-DD）
  const today = new Date().toISOString().slice(0, 10);

  // --- 件数（ヘッダー用） ---
  // 未完了（pending）
  const { count: pendingCount } = await supabase
    .from("employee_annual_events")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  // 期限超過（今日より前 & pending）
  const { count: overdueCount } = await supabase
    .from("employee_annual_events")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending")
    .lt("scheduled_date", today);

  // --- 一覧データ（フィルタ反映） ---
  let query = supabase
    .from("employee_annual_events")
    .select("id, scheduled_date, title, event_type, status, priority")
    .order("scheduled_date", { ascending: true })
    .limit(200);

  if (status) query = query.eq("status", status);
  if (type) query = query.eq("event_type", type);
  if (q) query = query.ilike("title", `%${q}%`);

  // 年度絞り込み（YYYY）
  if (/^\d{4}$/.test(year)) {
    const from = `${year}-01-01`;
    const to = `${year}-12-31`;
    query = query.gte("scheduled_date", from).lte("scheduled_date", to);
  }

  // 期限超過だけ
  if (overdue === "1") {
    query = query.lt("scheduled_date", today).eq("status", "pending");
  }

  const { data, error } = await query;

  if (error) {
    return (
      <div className="rounded-2xl border bg-white p-6">
        <div className="text-xl font-bold">年間イベント</div>
        <div className="mt-2 text-sm text-rose-600">読み込みに失敗：{error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl border bg-white p-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-2xl font-bold">年間イベント</div>
          <div className="mt-2 text-sm text-slate-600">
            未完了/期限超過の件数を見ながら、すぐ絞り込みできます。
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/annual-events?status=pending"
            className="inline-flex items-center gap-2 rounded-xl border bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            未完了
            <span className="rounded-lg bg-white px-2 py-1 text-xs font-bold">
              {pendingCount ?? 0}
            </span>
          </Link>

          <Link
            href="/annual-events?overdue=1"
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100/70"
          >
            期限超過
            <span className="rounded-lg bg-white px-2 py-1 text-xs font-bold text-rose-700">
              {overdueCount ?? 0}
            </span>
          </Link>

          <Link
            href="/annual-events/new"
            className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
          >
            + イベント登録
          </Link>
        </div>
      </div>

      {/* Filters */}
      <AnnualEventFilters />

      {/* Table */}
      <div className="rounded-2xl border bg-white p-4 overflow-auto">
        <table className="min-w-[1100px] w-full text-sm">
          <thead className="text-slate-500">
            <tr className="border-b">
              <th className="py-2 text-left">予定日</th>
              <th className="py-2 text-left">タイトル</th>
              <th className="py-2 text-left">種別</th>
              <th className="py-2 text-left">状態</th>
              <th className="py-2 text-left">優先度</th>
              <th className="py-2 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((e) => (
              <tr key={e.id} className="border-b last:border-b-0">
                <td className="py-2">{e.scheduled_date}</td>
                <td className="py-2 font-semibold">
                  <Link className="text-indigo-600 hover:underline" href={`/annual-events/${e.id}`}>
                    {e.title}
                  </Link>
                </td>
                <td className="py-2">{e.event_type}</td>
                <td className="py-2">{e.status}</td>
                <td className="py-2">{e.priority}</td>
                <td className="py-2">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      className="inline-flex h-8 items-center rounded-lg border bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      href={`/annual-events/${e.id}`}
                    >
                      詳細
                    </Link>
                    <Link
                      className="inline-flex h-8 items-center rounded-lg border bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      href={`/annual-events/${e.id}/edit`}
                    >
                      編集
                    </Link>
                    <form action={`/api/annual-events/${e.id}/complete`} method="post">
                      <button
                        disabled={e.status === "done"}
                        className={[
                          "inline-flex h-8 items-center rounded-lg px-3 text-xs font-semibold text-white",
                          e.status === "done"
                            ? "bg-slate-400 cursor-not-allowed"
                            : "bg-slate-900 hover:bg-slate-800",
                        ].join(" ")}
                      >
                        完了化
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}

            {(data ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-500">
                  該当するイベントがありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}