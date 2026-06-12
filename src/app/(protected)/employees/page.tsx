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

  const attentionParam = sp.attention;
  const attentionFilter = Array.isArray(attentionParam)
    ? attentionParam[0] ?? ""
    : attentionParam ?? "";

  const qParam = sp.q;
  const q = Array.isArray(qParam) ? qParam[0] ?? "" : qParam ?? "";
  const keyword = q.trim().toLowerCase();

  const { data, error } = await supabase
    .from("employees")
    .select(
      "id, employee_code, name, email, app_role, status, user_id, last_invited_at"
    )
    .order("employee_code", { ascending: true })
    .limit(200);

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

  const allEmployees = data ?? [];
  const employeeIds = allEmployees.map((e) => e.id);

  const today = new Date().toISOString().slice(0, 10);

  const alertDateObj = new Date();
  alertDateObj.setDate(alertDateObj.getDate() + 30);
  const alertDate = alertDateObj.toISOString().slice(0, 10);

  const { data: qualifications } =
    employeeIds.length > 0
      ? await supabase
          .from("employee_qualifications")
          .select("id, employee_id, qualification_name, expires_on, status")
          .in("employee_id", employeeIds)
      : { data: [] as any[] };

  const { data: annualEvents } =
    employeeIds.length > 0
      ? await supabase
          .from("employee_annual_events")
          .select("id, employee_id, title, scheduled_date, status")
          .in("employee_id", employeeIds)
      : { data: [] as any[] };

  const { data: interviews } =
    employeeIds.length > 0
      ? await supabase
          .from("employee_interviews")
          .select(
            "id, employee_id, next_interview_date, next_interview_completed_at"
          )
          .in("employee_id", employeeIds)
      : { data: [] as any[] };

  const attentionByEmployeeId = new Map<
    string,
    {
      expiredQualifications: number;
      expiringSoonQualifications: number;
      overdueEvents: number;
      pendingInterviews: number;
      total: number;
    }
  >();

  for (const employee of allEmployees) {
    const employeeQualifications = (qualifications ?? []).filter(
      (q: any) => q.employee_id === employee.id
    );

    const employeeEvents = (annualEvents ?? []).filter(
      (e: any) => e.employee_id === employee.id
    );

    const employeeInterviews = (interviews ?? []).filter(
      (i: any) => i.employee_id === employee.id
    );

    const expiredQualifications = employeeQualifications.filter(
      (q: any) => q.expires_on && q.expires_on < today
    ).length;

    const expiringSoonQualifications = employeeQualifications.filter(
      (q: any) =>
        q.expires_on && q.expires_on >= today && q.expires_on <= alertDate
    ).length;

    const overdueEvents = employeeEvents.filter(
      (e: any) => e.status === "pending" && e.scheduled_date < today
    ).length;

    const pendingInterviews = employeeInterviews.filter(
      (i: any) => i.next_interview_date && !i.next_interview_completed_at
    ).length;

    const total =
      expiredQualifications +
      expiringSoonQualifications +
      overdueEvents +
      pendingInterviews;

    attentionByEmployeeId.set(employee.id, {
      expiredQualifications,
      expiringSoonQualifications,
      overdueEvents,
      pendingInterviews,
      total,
    });
  }

  const activeCount = allEmployees.filter((e) => e.status === "active").length;
  const inactiveCount = allEmployees.filter((e) => e.status !== "active").length;
  const uninvitedCount = allEmployees.filter((e) => !e.user_id).length;
  const invitedCount = allEmployees.filter((e) => !!e.user_id).length;

  const attentionCount = allEmployees.filter((e) => {
    const attention = attentionByEmployeeId.get(e.id);
    return (attention?.total ?? 0) > 0;
  }).length;

  const employees = allEmployees.filter((e) => {
    if (inviteFilter === "uninvited" && e.user_id) return false;

    if (attentionFilter === "required") {
      const attention = attentionByEmployeeId.get(e.id);
      if ((attention?.total ?? 0) <= 0) return false;
    }

    if (keyword) {
      const text = [e.employee_code, e.name, e.email, e.app_role, e.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!text.includes(keyword)) return false;
    }

    return true;
  });

  return (
    <PageShell>
      <Hero
        title="社員一覧"
        subtitle="社員情報、ロール、在籍状態、招待状況、要対応の有無を確認し、社員カルテへ素早くアクセスできます。"
        meta={
          <div className="flex flex-wrap gap-2">
            <Chip tone="info">Employee Management</Chip>
            <Chip>ログイン権限: {me.role}</Chip>
            <Chip>表示件数: {employees.length}</Chip>

            {q && <Chip tone="info">検索: {q}</Chip>}

            {inviteFilter === "uninvited" && (
              <Chip tone="danger">未招待のみ表示中</Chip>
            )}

            {attentionFilter === "required" && (
              <Chip tone="danger">要対応ありのみ表示中</Chip>
            )}
          </div>
        }
        right={
          <>
            <PrimaryButton href="/employees">全社員</PrimaryButton>
            <PrimaryButton href="/employees?invite=uninvited">
              未招待だけ
            </PrimaryButton>
            <PrimaryButton href="/employees?attention=required">
              要対応あり
            </PrimaryButton>
            {(me.role === "admin" || me.role === "hr") && (
              <PrimaryButton href="/employees/new">+ 社員登録</PrimaryButton>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
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
        <KPI
          label="要対応あり"
          value={attentionCount}
          tone={attentionCount > 0 ? "danger" : "ok"}
          href="/employees?attention=required"
        />
      </div>

      <Card className="p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">社員検索</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              社員番号・氏名・メールで検索できます。未招待・要対応ありでの絞り込みも可能です。
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Chip>社員番号順</Chip>
            <Chip tone="gray">最大200件</Chip>
            <Chip tone={inviteFilter === "uninvited" ? "danger" : "gray"}>
              {inviteFilter === "uninvited" ? "未招待のみ" : "全社員"}
            </Chip>
            <Chip tone={attentionFilter === "required" ? "danger" : "gray"}>
              {attentionFilter === "required" ? "要対応ありのみ" : "要対応含む"}
            </Chip>
          </div>
        </div>

        <form
          action="/employees"
          className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto]"
        >
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="社員番号・氏名・メールで検索"
            className="input"
          />

          {inviteFilter && (
            <input type="hidden" name="invite" value={inviteFilter} />
          )}

          {attentionFilter && (
            <input type="hidden" name="attention" value={attentionFilter} />
          )}

          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-black text-white hover:bg-slate-800"
          >
            検索
          </button>

          <Link
            href="/employees"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            クリア
          </Link>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">社員一覧</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              社員番号をクリックすると、社員カルテを表示します。要対応列から注意が必要な社員を確認できます。
            </p>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-[1350px] w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr className="border-b border-slate-100">
                <th className="px-5 py-3 text-left font-black">社員番号</th>
                <th className="px-5 py-3 text-left font-black">氏名</th>
                <th className="px-5 py-3 text-left font-black">メール</th>
                <th className="px-5 py-3 text-left font-black">ロール</th>
                <th className="px-5 py-3 text-left font-black">状態</th>
                <th className="px-5 py-3 text-left font-black">要対応</th>
                <th className="px-5 py-3 text-left font-black">招待</th>
              </tr>
            </thead>

            <tbody>
              {employees.map((e) => {
                const attention = attentionByEmployeeId.get(e.id);
                const attentionTotal = attention?.total ?? 0;

                return (
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
                      {attentionTotal > 0 ? (
                        <div className="flex flex-col gap-2">
                          <Link
                            href={`/employees/code/${e.employee_code}?tab=timeline`}
                            className="inline-flex w-fit items-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-black text-rose-700 hover:bg-rose-100"
                          >
                            要対応あり：{attentionTotal}
                          </Link>

                          <div className="flex flex-wrap gap-1">
                            {(attention?.expiredQualifications ?? 0) > 0 && (
                              <span className="rounded-lg bg-rose-100 px-2 py-1 text-[11px] font-black text-rose-700">
                                資格切れ {attention?.expiredQualifications}
                              </span>
                            )}

                            {(attention?.expiringSoonQualifications ?? 0) >
                              0 && (
                              <span className="rounded-lg bg-amber-100 px-2 py-1 text-[11px] font-black text-amber-700">
                                資格30日 {attention?.expiringSoonQualifications}
                              </span>
                            )}

                            {(attention?.overdueEvents ?? 0) > 0 && (
                              <span className="rounded-lg bg-rose-100 px-2 py-1 text-[11px] font-black text-rose-700">
                                イベント超過 {attention?.overdueEvents}
                              </span>
                            )}

                            {(attention?.pendingInterviews ?? 0) > 0 && (
                              <span className="rounded-lg bg-emerald-100 px-2 py-1 text-[11px] font-black text-emerald-700">
                                次回面談 {attention?.pendingInterviews}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <Chip tone="ok">対応なし</Chip>
                      )}
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
                );
              })}

              {employees.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center">
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