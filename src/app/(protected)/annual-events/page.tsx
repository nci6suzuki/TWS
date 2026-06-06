import Link from "next/link";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AnnualEventsPage() {
  await requireAuth();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("employee_annual_events")
    .select("id, scheduled_date, title, event_type, status, priority")
    .order("scheduled_date", { ascending: true })
    .limit(200);

  if (error) {
    return (
      <div className="rounded-2xl border bg-white p-6">
        <div className="text-lg font-bold">年間イベント</div>
        <div className="mt-2 text-sm text-rose-600">読み込みに失敗：{error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-6 flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold">年間イベント</div>
          <div className="mt-2 text-sm text-slate-600">まずは最小の一覧表示です（RLS動作確認用）。</div>
        </div>
        <Link
          href="/annual-events/new"
          className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
        >
          + イベント登録
        </Link>
      </div>

      <div className="rounded-2xl border bg-white p-4 overflow-auto">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="text-slate-500">
            <tr className="border-b">
              <th className="py-2 text-left">予定日</th>
              <th className="py-2 text-left">タイトル</th>
              <th className="py-2 text-left">種別</th>
              <th className="py-2 text-left">状態</th>
              <th className="py-2 text-left">優先度</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((e) => (
              <tr key={e.id} className="border-b last:border-b-0">
                <td className="py-2">{e.scheduled_date}</td>
                <td className="py-2 font-semibold">{e.title}</td>
                <td className="py-2">{e.event_type}</td>
                <td className="py-2">{e.status}</td>
                <td className="py-2">{e.priority}</td>
              </tr>
            ))}
            {(data ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-500">
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