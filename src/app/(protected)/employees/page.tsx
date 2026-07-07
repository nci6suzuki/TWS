// src/app/(protected)/employees/page.tsx

import Link from "next/link";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseServerDbClient } from "@/lib/supabase/server-db";
import { PageShell } from "@/components/ui/page-shell";
import {
  Hero,
  KPI,
  Chip,
  PrimaryButton,
  GhostButton,
  Card,
} from "@/components/ui/ux";
import { InviteButton } from "@/components/employees/invite-button";
import { SubmitButton } from "@/components/ui/submit-button";
import { buttonClassName } from "@/lib/ui/button-class";
import { ClickableRow } from "@/components/ui/clickable-row";

export const runtime = "nodejs";

type AttentionItem = {
  total: number;
  expiredQualifications: number;
  soonQualifications: number;
  overdueEvents: number;
  pendingInterviews: number;
};

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const me = await requireAuth();
  const supabase = await createSupabaseServerDbClient();

  const getParam = (key: string) => {
    const v = sp[key];
    return Array.isArray(v) ? v[0] ?? "" : v ?? "";
  };

  const q = getParam("q").trim();
  const invite = getParam("invite");
  const attention = getParam("attention");

  const today = formatDate(new Date());

  const alertDateObj = new Date();
  alertDateObj.setDate(alertDateObj.getDate() + 30);
  const alertDate = formatDate(alertDateObj);

  let query = supabase
    .from("employees")
    .select(
      "id, employee_code, name, email, app_role, status, user_id, last_invited_at"
    )
    .order("employee_code", { ascending: true })
    .limit(1000);

  if (q) {
    query = query.or(
      `employee_code.ilike.%${q}%,name.ilike.%${q}%,email.ilike.%${q}%`
    );
  }

  if (invite === "uninvited") {
    query = query.is("user_id", null);
  }

  const { data, error } = await query;

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

  const employees = data ?? [];
  const employeeIds = employees.map((e) => e.id);

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

  const attentionByEmployeeId = new Map<string, AttentionItem>();

  for (const employee of employees) {
    attentionByEmployeeId.set(employee.id, {
      total: 0,
      expiredQualifications: 0,
      soonQualifications: 0,
      overdueEvents: 0,
      pendingInterviews: 0,
    });
  }

  for (const qualification of qualifications ?? []) {
    if (!qualification.expires_on) continue;

    const attentionItem = attentionByEmployeeId.get(qualification.employee_id);
    if (!attentionItem) continue;

    if (qualification.expires_on < today) {
      attentionItem.expiredQualifications += 1;
      attentionItem.total += 1;
    } else if (qualification.expires_on <= alertDate) {
      attentionItem.soonQualifications += 1;
      attentionItem.total += 1;
    }
  }

  for (const event of annualEvents ?? []) {
    if (!event.scheduled_date) continue;

    const attentionItem = attentionByEmployeeId.get(event.employee_id);
    if (!attentionItem) continue;

    if (event.status === "pending" && event.scheduled_date < today) {
      attentionItem.overdueEvents += 1;
      attentionItem.total += 1;
    }
  }

  for (const interview of interviews ?? []) {
    const attentionItem = attentionByEmployeeId.get(interview.employee_id);
    if (!attentionItem) continue;

    if (
      interview.next_interview_date &&
      !interview.next_interview_completed_at
    ) {
      attentionItem.pendingInterviews += 1;
      attentionItem.total += 1;
    }
  }

  const visibleEmployees =
    attention === "required"
      ? employees.filter((employee) => {
          const item = attentionByEmployeeId.get(employee.id);
          return (item?.total ?? 0) > 0;
        })
      : employees;

  const totalCount = employees.length;
  const activeCount = employees.filter((e) => e.status === "active").length;
  const inactiveCount = employees.filter((e) => e.status !== "active").length;
  const invitedCount = employees.filter((e) => e.user_id).length;
  const uninvitedCount = employees.filter((e) => !e.user_id).length;

  const attentionCount = employees.filter((employee) => {
    const item = attentionByEmployeeId.get(employee.id);
    return (item?.total ?? 0) > 0;
  }).length;

  const baseParams = new URLSearchParams();

  if (q) baseParams.set("q", q);
  if (invite) baseParams.set("invite", invite);
  if (attention) baseParams.set("attention", attention);

  const exportHref = `/api/employees/export${
    baseParams.toString() ? `?${baseParams.toString()}` : ""
  }`;

  const filterHref = (params: Record<string, string>) => {
    const p = new URLSearchParams();

    if (q) p.set("q", q);

    Object.entries(params).forEach(([key, value]) => {
      if (value) p.set(key, value);
    });

    return `/employees?${p.toString()}`;
  };

  return (
    <PageShell>
      <div className="space-y-6">
        <Hero
          title="社員一覧"
          subtitle="社員カルテ、招待状況、資格期限、年間イベント、面談予定をまとめて確認できます。"
          meta={
            <div className="flex flex-wrap gap-2">
              <Chip tone="info">Employees</Chip>
              <Chip>表示件数: {visibleEmployees.length}</Chip>
              <Chip>ログイン権限: {me.role}</Chip>

              {q && <Chip tone="info">検索: {q}</Chip>}

              {invite === "uninvited" && (
                <Chip tone="danger">未招待のみ表示中</Chip>
              )}

              {attention === "required" && (
                <Chip tone="danger">要対応のみ表示中</Chip>
              )}
            </div>
          }
          right={
            <>
              <PrimaryButton href="/employees">全社員</PrimaryButton>

              <PrimaryButton href="/employee-analytics">
                社員分析
              </PrimaryButton>

              <GhostButton href={filterHref({ invite: "uninvited" })}>
                未招待
              </GhostButton>

              <PrimaryButton href={filterHref({ attention: "required" })}>
                要対応
              </PrimaryButton>

              {(me.role === "admin" || me.role === "hr") && (
                <>
                  <PrimaryButton href={exportHref}>CSV出力</PrimaryButton>
                  <PrimaryButton href="/employees/new">
                    + 社員登録
                  </PrimaryButton>
                </>
              )}
            </>
          }
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <KPI label="社員数" value={totalCount} />
          <KPI label="在籍中" value={activeCount} tone="ok" />

          <KPI
            label="休職・退職等"
            value={inactiveCount}
            tone={inactiveCount > 0 ? "danger" : "ok"}
          />

          <KPI label="招待済" value={invitedCount} tone="ok" />

          <KPI
            label="未招待"
            value={uninvitedCount}
            tone={uninvitedCount > 0 ? "danger" : "ok"}
            href={filterHref({ invite: "uninvited" })}
          />

          <KPI
            label="要対応あり"
            value={attentionCount}
            tone={attentionCount > 0 ? "danger" : "ok"}
            href={filterHref({ attention: "required" })}
          />
        </div>

        <Card className="p-5">
          <form className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto]">
            <input
              className="input"
              type="search"
              name="q"
              placeholder="社員番号・氏名・メールで検索"
              defaultValue={q}
            />

            {invite && <input type="hidden" name="invite" value={invite} />}

            {attention && (
              <input type="hidden" name="attention" value={attention} />
            )}

            <SubmitButton
              pendingText="検索中..."
              className={buttonClassName(
                "inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-black text-white hover:bg-slate-800"
              )}
            >
              検索
            </SubmitButton>

            <Link
              href="/employees"
              className={buttonClassName(
                "inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 hover:bg-slate-50"
              )}
            >
              条件クリア
            </Link>
          </form>
        </Card>

        <div className="space-y-3 md:hidden">
          {visibleEmployees.length === 0 ? (
            <Card className="p-6 text-center text-sm font-bold text-slate-500">
              表示できる社員がいません
            </Card>
          ) : (
            visibleEmployees.map((employee) => {
              const attentionItem = attentionByEmployeeId.get(employee.id);
              const hasAttention = (attentionItem?.total ?? 0) > 0;

              return (
                <Card key={employee.id} className="p-3">
                  <ClickableRow
                    href={`/employees/code/${employee.employee_code}`}
                    className="border-slate-100 bg-slate-50 p-4 shadow-none"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-black text-slate-400">
                          {employee.employee_code}
                        </div>

                        <div className="mt-1 truncate text-lg font-black text-slate-900 group-hover:text-indigo-700">
                          {employee.name}
                        </div>

                        <div className="mt-1 truncate text-xs font-semibold text-slate-500">
                          {employee.email || "-"}
                        </div>
                      </div>

                      <div className="shrink-0 text-xs font-black text-indigo-600">
                        詳細 →
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Chip tone="info">{getRoleLabel(employee.app_role)}</Chip>

                      <Chip
                        tone={employee.status === "active" ? "ok" : "danger"}
                      >
                        {getStatusLabel(employee.status)}
                      </Chip>

                      {employee.user_id ? (
                        <Chip tone="ok">招待済</Chip>
                      ) : (
                        <Chip tone="danger">未招待</Chip>
                      )}

                      {hasAttention ? (
                        <Chip tone="danger">
                          要対応 {attentionItem?.total ?? 0}件
                        </Chip>
                      ) : (
                        <Chip tone="ok">要対応なし</Chip>
                      )}
                    </div>
                  </ClickableRow>

                  {hasAttention && (
                    <div className="mt-3 rounded-2xl bg-rose-50 p-3">
                      <AttentionSummary attentionItem={attentionItem} />
                    </div>
                  )}

                  {employee.last_invited_at && (
                    <div className="mt-3 text-xs font-semibold text-slate-400">
                      最終招待: {formatDateTime(employee.last_invited_at)}
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/employees/code/${employee.employee_code}`}
                      className={buttonClassName(
                        "inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      詳細
                    </Link>

                    <Link
                      href={`/employees/code/${employee.employee_code}/edit`}
                      className={buttonClassName(
                        "inline-flex h-9 items-center rounded-lg bg-slate-900 px-3 text-xs font-black text-white hover:bg-slate-800"
                      )}
                    >
                      編集
                    </Link>

                    {(me.role === "admin" || me.role === "hr") && (
                      <InviteButton
                        employeeId={employee.id}
                        force={!employee.user_id}
                        label={employee.user_id ? "再招待" : "招待"}
                      />
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>

        <Card className="hidden overflow-hidden md:block">
          <div className="overflow-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="px-4 py-3 text-left font-black">社員番号</th>
                  <th className="px-4 py-3 text-left font-black">氏名</th>
                  <th className="px-4 py-3 text-left font-black">メール</th>
                  <th className="px-4 py-3 text-left font-black">ロール</th>
                  <th className="px-4 py-3 text-left font-black">状態</th>
                  <th className="px-4 py-3 text-left font-black">招待</th>
                  <th className="px-4 py-3 text-left font-black">要対応</th>
                  <th className="px-4 py-3 text-left font-black">操作</th>
                </tr>
              </thead>

              <tbody>
                {visibleEmployees.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-sm font-bold text-slate-500"
                    >
                      表示できる社員がいません
                    </td>
                  </tr>
                ) : (
                  visibleEmployees.map((employee) => {
                    const attentionItem = attentionByEmployeeId.get(
                      employee.id
                    );
                    const hasAttention = (attentionItem?.total ?? 0) > 0;

                    return (
                      <tr
                        key={employee.id}
                        className="group border-b border-slate-100 bg-white transition hover:bg-indigo-50/40"
                      >
                        <td className="px-4 py-3 font-black text-slate-900">
                          {employee.employee_code}
                        </td>

                        <td className="px-4 py-3">
                          <Link
                            href={`/employees/code/${employee.employee_code}`}
                            className={buttonClassName(
                              "font-black text-indigo-600 hover:underline"
                            )}
                          >
                            {employee.name}
                          </Link>
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          {employee.email || "-"}
                        </td>

                        <td className="px-4 py-3">
                          <Chip tone="info">
                            {getRoleLabel(employee.app_role)}
                          </Chip>
                        </td>

                        <td className="px-4 py-3">
                          <Chip
                            tone={
                              employee.status === "active" ? "ok" : "danger"
                            }
                          >
                            {getStatusLabel(employee.status)}
                          </Chip>
                        </td>

                        <td className="px-4 py-3">
                          {employee.user_id ? (
                            <Chip tone="ok">招待済</Chip>
                          ) : (
                            <Chip tone="danger">未招待</Chip>
                          )}

                          {employee.last_invited_at && (
                            <div className="mt-1 text-xs font-semibold text-slate-400">
                              最終: {formatDateTime(employee.last_invited_at)}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {hasAttention ? (
                            <Link
                              href={`/employees/code/${employee.employee_code}?tab=timeline`}
                              className={buttonClassName(
                                "inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-700 hover:bg-rose-100"
                              )}
                            >
                              {attentionItem?.total ?? 0}件
                            </Link>
                          ) : (
                            <Chip tone="ok">なし</Chip>
                          )}

                          {hasAttention && (
                            <div className="mt-2">
                              <AttentionSummary attentionItem={attentionItem} />
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/employees/code/${employee.employee_code}`}
                              className={buttonClassName(
                                "inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:bg-slate-50"
                              )}
                            >
                              詳細
                            </Link>

                            <Link
                              href={`/employees/code/${employee.employee_code}/edit`}
                              className={buttonClassName(
                                "inline-flex h-8 items-center rounded-lg bg-slate-900 px-3 text-xs font-black text-white hover:bg-slate-800"
                              )}
                            >
                              編集
                            </Link>

                            {(me.role === "admin" || me.role === "hr") && (
                              <InviteButton
                                employeeId={employee.id}
                                force={!employee.user_id}
                                label={employee.user_id ? "再招待" : "招待"}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

function AttentionSummary({
  attentionItem,
}: {
  attentionItem: AttentionItem | undefined;
}) {
  if (!attentionItem) return null;

  return (
    <div className="space-y-1 text-xs font-semibold text-slate-500">
      {attentionItem.expiredQualifications > 0 && (
        <div>資格期限切れ: {attentionItem.expiredQualifications}</div>
      )}

      {attentionItem.soonQualifications > 0 && (
        <div>資格30日以内: {attentionItem.soonQualifications}</div>
      )}

      {attentionItem.overdueEvents > 0 && (
        <div>イベント期限超過: {attentionItem.overdueEvents}</div>
      )}

      {attentionItem.pendingInterviews > 0 && (
        <div>次回面談予定: {attentionItem.pendingInterviews}</div>
      )}
    </div>
  );
}

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  return d.toLocaleString("ja-JP");
}

function getRoleLabel(role: string) {
  if (role === "admin") return "管理者";
  if (role === "hr") return "人事";
  if (role === "manager") return "上長";
  if (role === "mentor") return "メンター";
  if (role === "employee") return "社員";

  return role || "";
}

function getStatusLabel(status: string) {
  if (status === "active") return "在籍中";
  if (status === "leave") return "休職中";
  if (status === "inactive") return "退職・無効";

  return status || "";
}