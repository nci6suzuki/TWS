// src/app/(protected)/employees/page.tsx

import Link from "next/link";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseServerDbClient } from "@/lib/supabase/server-db";
import { PageShell } from "@/components/ui/page-shell";
import { Hero, KPI, Chip, PrimaryButton, Card } from "@/components/ui/ux";
import { InviteButton } from "@/components/employees/invite-button";

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const me = await requireAuth();
  const supabase = await createSupabaseServerDbClient();

  const inviteParam = sp.invite;
  const inviteFilter = Array.isArray(inviteParam)
    ? inviteParam[0] ?? ""
    : inviteParam ?? "";

  const { data, error } = await supabase
    .from("employees")
    .select(
      "id, employee_code, name, email, app_role, status, user_id, last_invited_at"
    )
    .order("employee_code", { ascending: true })
    .limit(200);

  const allEmployees = data ?? [];

  const employees =
    inviteFilter === "uninvited"
      ? allEmployees.filter((e) => !e.user_id)
      : allEmployees;

  const activeCount = allEmployees.filter((e) => e.status === "active").length;
  const inactiveCount = allEmployees.filter((e) => e.status !== "active").length;
  const adminCount = allEmployees.filter(
    (e) => e.app_role === "admin" || e.app_role === "hr"
  ).length;
  const uninvitedCount = allEmployees.filter((e) => !e.user_id).length;
  const invitedCount = allEmployees.filter((e) => !!e.user_id).length;

  if (error) {
    return (
      <PageShell>
        <Card className="p-6">
          <div className="text-xl font-black text-slate-900">社員一覧</div>
          <div className="mt-2 text-sm font-semibold text-rose-600">
            読み込みに失敗：{error.message}
          </div>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Hero
        title="社員一覧"
        subtitle="社員情報、ロール、在籍状態、招待状況を確認し、社員カルテへ素早くアクセスできます。"
        meta={
          <div className="flex flex-wrap gap-2">
            <Chip tone="info">Employee Management</Chip>
            <Chip>ログイン権限: {me.role}</Chip>
            <Chip>表示件数: {employees.length}</Chip>
            {inviteFilter === "uninvited" && (
              <Chip tone="danger">未招待のみ表示中</Chip>
            )}
          </div>
        }
        right={
          <>
            <PrimaryButton href="/employees">全社員</PrimaryButton>
            <PrimaryButton href="/employees?invite=uninvited">
              未招待だけ
            </PrimaryButton>
            {(me.role === "admin" || me.role === "hr") && (
              <PrimaryButton href="/employees/new">+ 社員登録</PrimaryButton>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        <KPI label="社員数" value={allEmployees.length} />
        <KPI label="在籍中" value={activeCount} tone="ok" />
        <KPI label="休職・退職等" value={inactiveCount} tone="danger" />
        <KPI label="招待済" value={invitedCount} tone="ok" />
        <KPI
          label="未招待"
          value={uninvitedCount}
          tone="danger"
          href="/employees?invite=uninvited"
        />
      </div>

      <Card className="p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">社員検索</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              現在は社員番号順で最大200件を表示しています。未招待の社員だけに絞り込めます。
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Chip>社員番号順</Chip>
            <Chip tone="gray">最大200件</Chip>
            <Chip tone={inviteFilter === "uninvited" ? "danger" : "gray"}>
              {inviteFilter === "uninvited" ? "未招待のみ" : "全社員"}
            </Chip>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">社員一覧</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              社員番号をクリックすると、社員カルテを表示します。招待列からログイン招待を送信できます。
            </p>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-[1150px] w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr className="border-b border-slate-100">
                <th className="px-5 py-3 text-left font-black">社員番号</th>
                <th className="px-5 py-3 text-left font-black">氏名</th>
                <th className="px-5 py-3 text-left font-black">メール</th>
                <th className="px-5 py-3 text-left font-black">ロール</th>
                <th className="px-5 py-3 text-left font-black">状態</th>
                <th className="px-5 py-3 text-left font-black">招待</th>
              </tr>
            </thead>

            <tbody>
              {employees.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-slate-100 last:border-b-0 transition hover:bg-slate-50"
                >
                  <td className="px-5 py-4 font-black">
                    <Link
                      className="inline-flex items-center rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-black text-slate-800 transition hover:bg-slate-200"
                      href={`/employees/code/${e.employee_code}`}
                    >
                      {e.employee_code}
                    </Link>
                  </td>

                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-900">{e.name}</div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="text-slate-600">{e.email}</div>
                  </td>

                  <td className="px-5 py-4">
                    <Chip
                      tone={
                        e.app_role === "admin" || e.app_role === "hr"
                          ? "info"
                          : "gray"
                      }
                    >
                      {e.app_role}
                    </Chip>
                  </td>

                  <td className="px-5 py-4">
                    <Chip tone={e.status === "active" ? "ok" : "danger"}>
                      {e.status}
                    </Chip>
                  </td>

                  <td className="px-5 py-4">
                    {me.role === "admin" || me.role === "hr" ? (
                      <div className="flex flex-wrap items-center gap-2">
                        {e.user_id ? (
                          <>
                            <Chip tone="ok">招待済</Chip>
                            <InviteButton
                              employeeId={e.id}
                              force
                              label="再招待"
                            />
                          </>
                        ) : (
                          <>
                            <Chip tone="danger">未招待</Chip>
                            <InviteButton employeeId={e.id} />
                          </>
                        )}

                        {e.last_invited_at && (
                          <span className="text-xs font-semibold text-slate-500">
                            {new Date(e.last_invited_at).toLocaleString(
                              "ja-JP"
                            )}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">
                        -
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {employees.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center">
                    <div className="text-sm font-bold text-slate-500">
                      表示できる社員がいません
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </PageShell>
  );
}