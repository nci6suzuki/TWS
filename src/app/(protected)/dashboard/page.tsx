import Link from "next/link";
import { requireAuth } from "@/lib/auth/require-auth";

export default async function DashboardPage() {
  const me = await requireAuth();
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-6">
        <div className="text-2xl font-bold">ダッシュボード</div>
        <div className="mt-2 text-sm text-slate-600">ログイン済み：{me.role}</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link className="rounded-2xl border bg-white p-5 hover:bg-slate-50" href="/employees">社員一覧</Link>
        <Link className="rounded-2xl border bg-white p-5 hover:bg-slate-50" href="/annual-events">年間イベント</Link>
      </div>
    </div>
  );
}