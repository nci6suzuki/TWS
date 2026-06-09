import Link from "next/link";
import { PageShell } from "@/components/ui/page-shell";
import { Hero, KPI, Chip, PrimaryButton, GhostButton, Card } from "@/components/ui/ux";
import { createSupabaseServerDbClient } from "@/lib/supabase/server-db";
import { requireAuth } from "@/lib/auth/require-auth";

export default async function DashboardPage() {
  const me = await requireAuth();
  const supabase = await createSupabaseServerDbClient();

  const today = new Date().toISOString().slice(0, 10);

  const { count: pending } = await supabase
    .from("employee_annual_events")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: overdue } = await supabase
    .from("employee_annual_events")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending")
    .lt("scheduled_date", today);

  const { count: employees } = await supabase
    .from("employees")
    .select("id", { count: "exact", head: true });

  const { count: activeEmployees } = await supabase
    .from("employees")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  return (
    <PageShell>
      <Hero
        title="ダッシュボード"
        subtitle="社員情報・年間イベント・未完了タスクを一画面で確認できます。"
        meta={
          <div className="flex flex-wrap gap-2">
            <Chip tone="info">Talent Management</Chip>
            <Chip>ログイン権限: {me.role}</Chip>
            <Chip>基準日: {today}</Chip>
          </div>
        }
        right={
          <>
            <GhostButton href="/employees">社員一覧</GhostButton>
            <PrimaryButton href="/annual-events/new">+ イベント登録</PrimaryButton>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <KPI
          label="未完了イベント"
          value={pending ?? 0}
          href="/annual-events?status=pending&view=cards"
        />
        <KPI
          label="期限超過"
          value={overdue ?? 0}
          tone="danger"
          href="/annual-events?overdue=1&view=cards"
        />
        <KPI
          label="社員数"
          value={employees ?? 0}
          href="/employees"
        />
        <KPI
          label="在籍中"
          value={activeEmployees ?? 0}
          tone="ok"
          href="/employees"
        />
      </div>

      <Card className="p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              ショートカット
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              よく使う画面へすぐに移動できます。
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Chip tone="gray">Quick Access</Chip>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Link
            href="/employees"
            className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  Employees
                </div>
                <div className="mt-3 text-xl font-black text-slate-900">
                  社員一覧
                </div>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                  社員情報・ロール・在籍状態を確認します。
                </p>
              </div>
              <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-700 transition group-hover:bg-slate-900 group-hover:text-white">
                →
              </div>
            </div>
          </Link>

          <Link
            href="/annual-events"
            className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  Workflow
                </div>
                <div className="mt-3 text-xl font-black text-slate-900">
                  年間イベント
                </div>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                  面談・資格・研修などの予定を管理します。
                </p>
              </div>
              <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-700 transition group-hover:bg-slate-900 group-hover:text-white">
                →
              </div>
            </div>
          </Link>

          <Link
            href="/annual-events?status=pending&view=cards"
            className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  Pending
                </div>
                <div className="mt-3 text-xl font-black text-slate-900">
                  未完了一覧
                </div>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                  未処理のイベントだけを確認します。
                </p>
              </div>
              <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-700 transition group-hover:bg-slate-900 group-hover:text-white">
                →
              </div>
            </div>
          </Link>

          <Link
            href="/annual-events?overdue=1&view=cards"
            className="group rounded-3xl border border-rose-200 bg-rose-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-rose-400">
                  Overdue
                </div>
                <div className="mt-3 text-xl font-black text-rose-700">
                  期限超過
                </div>
                <p className="mt-2 text-sm font-medium leading-6 text-rose-600">
                  優先的に対応が必要なイベントを確認します。
                </p>
              </div>
              <div className="rounded-2xl bg-white px-3 py-2 text-sm font-black text-rose-700 transition group-hover:bg-rose-700 group-hover:text-white">
                →
              </div>
            </div>
          </Link>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                本日の確認ポイント
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                まずは期限超過と未完了イベントを確認してください。
              </p>
            </div>
            <Chip tone="info">Today</Chip>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm font-black text-slate-900">
                1. 期限超過イベントの確認
              </div>
              <p className="mt-1 text-sm font-medium text-slate-500">
                期限を過ぎている面談・資格・研修予定がないか確認します。
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm font-black text-slate-900">
                2. 未完了イベントの処理
              </div>
              <p className="mt-1 text-sm font-medium text-slate-500">
                完了済みのものは「完了化」し、一覧を最新状態に保ちます。
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                管理メニュー
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                マスタ・テンプレート系の管理画面です。
              </p>
            </div>
            <Chip tone="gray">Admin</Chip>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href="/settings/templates"
              className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-black text-slate-800 transition hover:bg-slate-50"
            >
              テンプレート管理
            </Link>

            <Link
              href="/employees/new"
              className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-black text-slate-800 transition hover:bg-slate-50"
            >
              社員登録
            </Link>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}