import Link from "next/link";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function EmployeesPage() {
  await requireAuth();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("employees")
    .select("id, employee_code, name, email, app_role, status")
    .order("employee_code", { ascending: true })
    .limit(200);

  if (error) {
    return (
      <div className="rounded-2xl border bg-white p-6">
        <div className="text-lg font-bold">社員一覧</div>
        <div className="mt-2 text-sm text-rose-600">読み込みに失敗：{error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-6 flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold">社員一覧</div>
          <div className="mt-2 text-sm text-slate-600">まずは最小の一覧表示です（RLS動作確認用）。</div>
        </div>
        <Link
          href="/employees/new"
          className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
        >
          + 社員登録
        </Link>
      </div>

      <div className="rounded-2xl border bg-white p-4 overflow-auto">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="text-slate-500">
            <tr className="border-b">
              <th className="py-2 text-left">社員番号</th>
              <th className="py-2 text-left">氏名</th>
              <th className="py-2 text-left">メール</th>
              <th className="py-2 text-left">ロール</th>
              <th className="py-2 text-left">状態</th>
              <th className="py-2 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((e) => (
              <tr key={e.id} className="border-b last:border-b-0">
                <td className="py-2 font-semibold">{e.employee_code}</td>
                <td className="py-2">{e.name}</td>
                <td className="py-2">{e.email}</td>
                <td className="py-2">{e.app_role}</td>
                <td className="py-2">{e.status}</td>
                <td className="py-2">
                  <span className="text-xs text-slate-500">（次に詳細を作ります）</span>
                </td>
              </tr>
            ))}
            {(data ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-500">
                  表示できる社員がいません（RLS or データ未投入）
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}