import Link from "next/link";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseServerDbClient } from "@/lib/supabase/server-db";

export default async function AnnualEventsPage() {
  await requireAuth();
  const supabase = await createSupabaseServerDbClient();

  const { data, error } = await supabase
    .from("employee_annual_events")
    .select("id, scheduled_date, title, event_type, status, priority")
    .order("scheduled_date", { ascending: true })
    .limit(200);

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
      <div className="rounded-2xl border bg-white p-6 flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold">年間イベント</div>
          <div className="mt-2 text-sm text-slate-600">一覧から詳細/編集/完了化できます。</div>
        </div>
        <Link
          href="/annual-events/new"
          className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
        >
          + イベント登録
        </Link>
      </div>

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
                  表示できるイベントがありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}