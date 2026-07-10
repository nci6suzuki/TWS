// src/app/(protected)/dashboard/page.tsx

import Link from "next/link";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseServerDbClient } from "@/lib/supabase/server-db";
import { PageShell } from "@/components/ui/page-shell";
import { Hero, KPI, Card, Chip, PrimaryButton } from "@/components/ui/ux";
import { buttonClassName } from "@/lib/ui/button-class";

export const runtime = "nodejs";

type EmployeeRow = {
  id: string;
  employee_code: string | null;
  name: string | null;
  email: string | null;
  status: string | null;
  app_role: string | null;
  organization_unit_id: string | null;
  manager_employee_id: string | null;
  position_title: string | null;
  position_started_on: string | null;
};

type PositionHistoryRow = {
  id: string;
  employee_id: string;
  change_type: string | null;
};

export default async function DashboardPage() {
  const me = await requireAuth();
  const supabase = await createSupabaseServerDbClient();

  const today = new Date().toISOString().slice(0, 10);

  const alertDateObj = new Date();
  alertDateObj.setDate(alertDateObj.getDate() + 30);
  const alertDate = alertDateObj.toISOString().slice(0, 10);

  const { data: employees, error: employeesError } = await supabase
    .from("employees")
    .select(
      "id, employee_code, name, email, status, app_role, organization_unit_id, manager_employee_id, position_title, position_started_on"
    )
    .order("employee_code", { ascending: true })
    .limit(500);

  if (employeesError) {
    return (
      <PageShell>
        <Card className="p-6">
          <div className="text-xl font-black text-slate-900">
            ダッシュボード
          </div>
          <div className="mt-2 text-sm font-semibold text-rose-600">
            社員情報の読み込みに失敗しました：{employeesError.message}
          </div>
        </Card>
      </PageShell>
    );
  }

  const allEmployees = (employees ?? []) as EmployeeRow[];
  const employeeIds = allEmployees.map((e) => e.id);

  const { data: qualifications, error: qualificationsError } =
    employeeIds.length > 0
      ? await supabase
          .from("employee_qualifications")
          .select("id, employee_id, qualification_name, expires_on, status")
          .in("employee_id", employeeIds)
      : { data: [] as any[], error: null };

  const { data: annualEvents, error: annualEventsError } =
    employeeIds.length > 0
      ? await supabase
          .from("employee_annual_events")
          .select("id, employee_id, title, scheduled_date, status")
          .in("employee_id", employeeIds)
      : { data: [] as any[], error: null };

  const { data: interviews, error: interviewsError } =
    employeeIds.length > 0
      ? await supabase
          .from("employee_interviews")
          .select(
            "id, employee_id, interview_date, next_interview_date, next_interview_completed_at"
          )
          .in("employee_id", employeeIds)
      : { data: [] as any[], error: null };

  const { data: positionHistories, error: positionHistoriesError } =
    employeeIds.length > 0
      ? await supabase
          .from("employee_position_histories")
          .select("id, employee_id, change_type")
          .in("employee_id", employeeIds)
      : { data: [] as PositionHistoryRow[], error: null };

  const { data: notifications, error: notificationsError } = await supabase
    .from("notifications")
    .select(
      "id, employee_id, title, message, notification_type, severity, status, due_date, related_type, related_id, created_at"
    )
    .eq("status", "unread")
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(5);

  const unreadNotifications = notifications ?? [];

  const unreadNotificationCount = unreadNotifications.length;
  const dangerNotificationCount = unreadNotifications.filter(
    (n: any) => n.severity === "danger"
  ).length;
  const warningNotificationCount = unreadNotifications.filter(
    (n: any) => n.severity === "warning"
  ).length;

  const loadError =
    qualificationsError?.message ??
    annualEventsError?.message ??
    interviewsError?.message ??
    positionHistoriesError?.message ??
    notificationsError?.message ??
    "";

  const expiredQualifications = (qualifications ?? []).filter(
    (q: any) => q.expires_on && q.expires_on < today
  );

  const expiringSoonQualifications = (qualifications ?? []).filter(
    (q: any) =>
      q.expires_on && q.expires_on >= today && q.expires_on <= alertDate
  );

  const overdueEvents = (annualEvents ?? []).filter(
    (e: any) => e.status === "pending" && e.scheduled_date < today
  );

  const pendingInterviews = (interviews ?? []).filter(
    (i: any) => i.next_interview_date && !i.next_interview_completed_at
  );

  const activeEmployees = allEmployees.filter((e) => e.status === "active");
  const inactiveEmployees = allEmployees.filter((e) => e.status !== "active");

  const organizationUnsetEmployees = activeEmployees.filter(
    (employee) => !employee.organization_unit_id
  );

  const managerUnsetEmployees = activeEmployees.filter(
    (employee) => !employee.manager_employee_id
  );

  const positionUnsetEmployees = activeEmployees.filter(
    (employee) => !employee.position_title
  );

  const positionHistoryRows =
    (positionHistories ?? []) as PositionHistoryRow[];

  const promotionCount = positionHistoryRows.filter(
    (history) => history.change_type === "promotion"
  ).length;

  const demotionCount = positionHistoryRows.filter(
    (history) => history.change_type === "demotion"
  ).length;

  const positionHistoryCount = positionHistoryRows.length;

  const managerIds = new Set(
    activeEmployees
      .map((employee) => employee.manager_employee_id)
      .filter(Boolean)
  );

  const managerCount = managerIds.size;

  const attentionEmployeeIds = new Set<string>();

  for (const q of expiredQualifications) {
    attentionEmployeeIds.add(q.employee_id);
  }

  for (const q of expiringSoonQualifications) {
    attentionEmployeeIds.add(q.employee_id);
  }

  for (const e of overdueEvents) {
    attentionEmployeeIds.add(e.employee_id);
  }

  for (const i of pendingInterviews) {
    attentionEmployeeIds.add(i.employee_id);
  }

  const attentionEmployees = allEmployees.filter((e) =>
    attentionEmployeeIds.has(e.id)
  );

  function getAttentionForEmployee(employeeId: string) {
    const expired = expiredQualifications.filter(
      (q: any) => q.employee_id === employeeId
    ).length;

    const soon = expiringSoonQualifications.filter(
      (q: any) => q.employee_id === employeeId
    ).length;

    const events = overdueEvents.filter(
      (e: any) => e.employee_id === employeeId
    ).length;

    const nextInterviews = pendingInterviews.filter(
      (i: any) => i.employee_id === employeeId
    ).length;

    return {
      expired,
      soon,
      events,
      nextInterviews,
      total: expired + soon + events + nextInterviews,
    };
  }

  return (
    <PageShell>
      <Hero
        title="ダッシュボード"
        subtitle="社員カルテ、資格、年間イベント、面談予定、通知、組織・役職の要対応状況を確認できます。"
        meta={
          <div className="flex flex-wrap gap-2">
            <Chip tone="info">Talent Management</Chip>
            <Chip>ログイン権限: {me.role}</Chip>
            <Chip>社員数: {allEmployees.length}</Chip>

            {unreadNotificationCount > 0 && (
              <Chip tone="danger">未読通知: {unreadNotificationCount}</Chip>
            )}

            {managerUnsetEmployees.length > 0 && (
              <Chip tone="danger">
                上司未設定: {managerUnsetEmployees.length}
              </Chip>
            )}

            {positionUnsetEmployees.length > 0 && (
              <Chip tone="danger">
                役職未設定: {positionUnsetEmployees.length}
              </Chip>
            )}
          </div>
        }
        right={
          <>
            <PrimaryButton href="/employees">社員一覧</PrimaryButton>
            <PrimaryButton href="/manager-overview">上司別配下</PrimaryButton>
            <PrimaryButton href="/employee-analytics">社員分析</PrimaryButton>
            <PrimaryButton href="/annual-events">年間イベント</PrimaryButton>
            <PrimaryButton href="/notifications">通知</PrimaryButton>
          </>
        }
      />

      {loadError && (
        <Card className="border-amber-200 bg-amber-50 p-5">
          <div className="text-sm font-black text-amber-800">
            一部データの読み込みに失敗しました
          </div>
          <div className="mt-1 text-sm font-semibold text-amber-700">
            {loadError}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KPI
          label="未読通知"
          value={unreadNotificationCount}
          tone={unreadNotificationCount > 0 ? "danger" : "ok"}
          href="/notifications"
        />

        <KPI
          label="要対応社員"
          value={attentionEmployees.length}
          tone={attentionEmployees.length > 0 ? "danger" : "ok"}
          href="/employees?attention=required"
        />

        <KPI
          label="資格期限切れ"
          value={expiredQualifications.length}
          tone={expiredQualifications.length > 0 ? "danger" : "ok"}
        />

        <KPI
          label="資格30日以内"
          value={expiringSoonQualifications.length}
          tone={expiringSoonQualifications.length > 0 ? "danger" : "ok"}
        />

        <KPI
          label="イベント期限超過"
          value={overdueEvents.length}
          tone={overdueEvents.length > 0 ? "danger" : "ok"}
          href="/annual-events?overdue=1"
        />

        <KPI
          label="次回面談予定"
          value={pendingInterviews.length}
          tone="ok"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KPI label="社員数" value={allEmployees.length} />
        <KPI label="在籍中" value={activeEmployees.length} tone="ok" />
        <KPI
          label="休職・退職等"
          value={inactiveEmployees.length}
          tone={inactiveEmployees.length > 0 ? "danger" : "ok"}
        />
        <KPI
          label="所属未設定"
          value={organizationUnsetEmployees.length}
          tone={organizationUnsetEmployees.length > 0 ? "danger" : "ok"}
          href="/employees?organization_unit_id=unassigned"
        />
        <KPI
          label="上司未設定"
          value={managerUnsetEmployees.length}
          tone={managerUnsetEmployees.length > 0 ? "danger" : "ok"}
          href="/manager-overview"
        />
        <KPI
          label="役職未設定"
          value={positionUnsetEmployees.length}
          tone={positionUnsetEmployees.length > 0 ? "danger" : "ok"}
          href="/employee-analytics"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <KPI
          label="上司数"
          value={managerCount}
          tone="info"
          href="/manager-overview"
        />
        <KPI
          label="役職履歴"
          value={positionHistoryCount}
          tone="info"
          href="/employee-analytics"
        />
        <KPI
          label="昇格"
          value={promotionCount}
          tone="ok"
          href="/employee-analytics"
        />
        <KPI
          label="降格"
          value={demotionCount}
          tone={demotionCount > 0 ? "danger" : "ok"}
          href="/employee-analytics"
        />
      </div>

      {(organizationUnsetEmployees.length > 0 ||
        managerUnsetEmployees.length > 0 ||
        positionUnsetEmployees.length > 0) && (
        <Card className="border-rose-200 bg-rose-50 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-black text-rose-700">
                組織・役職情報に未設定があります
              </div>
              <p className="mt-1 text-sm font-semibold text-rose-600">
                所属組織、直属上司、現在役職が未設定の社員は、社員編集画面から登録してください。
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/employees?organization_unit_id=unassigned"
                className={buttonClassName(
                  "inline-flex h-10 items-center rounded-xl border border-rose-200 bg-white px-4 text-sm font-black text-rose-700 hover:bg-rose-100"
                )}
              >
                所属未設定
              </Link>

              <Link
                href="/manager-overview"
                className={buttonClassName(
                  "inline-flex h-10 items-center rounded-xl bg-rose-600 px-4 text-sm font-black text-white hover:bg-rose-700"
                )}
              >
                上司別配下へ
              </Link>

              <Link
                href="/employee-analytics"
                className={buttonClassName(
                  "inline-flex h-10 items-center rounded-xl border border-rose-200 bg-white px-4 text-sm font-black text-rose-700 hover:bg-rose-100"
                )}
              >
                社員分析へ
              </Link>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-black text-slate-900">
              通知・リマインド
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              資格期限、年間イベント、期限超過などの未読通知を確認できます。
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Chip tone={unreadNotificationCount > 0 ? "danger" : "ok"}>
              未読 {unreadNotificationCount}
            </Chip>

            <Chip tone={dangerNotificationCount > 0 ? "danger" : "gray"}>
              重要 {dangerNotificationCount}
            </Chip>

            <Chip tone={warningNotificationCount > 0 ? "danger" : "gray"}>
              注意 {warningNotificationCount}
            </Chip>

            <Link
              href="/notifications"
              className={buttonClassName(
                "inline-flex h-10 items-center rounded-xl bg-slate-900 px-4 text-sm font-black text-white hover:bg-slate-800"
              )}
            >
              通知一覧へ
            </Link>
          </div>
        </div>

        <div className="mt-4">
          {unreadNotifications.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-5 text-center text-sm font-bold text-slate-500">
              未読通知はありません
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100">
              {unreadNotifications.map((n: any) => (
                <Link
                  key={n.id}
                  href={getNotificationHref(n)}
                  className="block bg-white p-4 hover:bg-slate-50"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Chip tone={getNotificationTone(n.severity)}>
                          {getNotificationSeverityLabel(n.severity)}
                        </Chip>

                        {n.due_date && <Chip>期限: {n.due_date}</Chip>}
                      </div>

                      <div className="mt-2 text-sm font-black text-slate-900">
                        {n.title}
                      </div>

                      <div className="mt-1 line-clamp-2 text-sm font-semibold text-slate-600">
                        {n.message || "-"}
                      </div>
                    </div>

                    <div className="text-xs font-bold text-slate-400">
                      {formatDateTime(n.created_at)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <form action="/api/notifications/generate" method="post">
            <button
              type="submit"
              className={buttonClassName(
                "inline-flex h-10 items-center rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-sm font-black text-indigo-700 hover:bg-indigo-100"
              )}
            >
              通知を生成・更新
            </button>
          </form>

          <Link
            href="/notifications"
            className={buttonClassName(
              "inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
            )}
          >
            すべて見る
          </Link>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  要対応社員
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  資格・年間イベント・面談予定で確認が必要な社員です。
                </p>
              </div>

              <Link
                href="/employees?attention=required"
                className={buttonClassName(
                  "inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
                )}
              >
                一覧で見る
              </Link>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {attentionEmployees.length === 0 ? (
              <div className="p-6 text-center text-sm font-bold text-slate-500">
                現在、要対応の社員はいません。
              </div>
            ) : (
              attentionEmployees.slice(0, 10).map((employee) => {
                const attention = getAttentionForEmployee(employee.id);

                return (
                  <div
                    key={employee.id}
                    className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <Link
                        href={`/employees/code/${employee.employee_code}?tab=timeline`}
                        className={buttonClassName(
                          "font-black text-slate-900 hover:underline"
                        )}
                      >
                        {employee.employee_code} / {employee.name}
                      </Link>

                      <div className="mt-1 text-sm font-semibold text-slate-500">
                        {employee.email ?? "-"}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1">
                        {attention.expired > 0 && (
                          <span className="rounded-lg bg-rose-100 px-2 py-1 text-[11px] font-black text-rose-700">
                            資格切れ {attention.expired}
                          </span>
                        )}

                        {attention.soon > 0 && (
                          <span className="rounded-lg bg-amber-100 px-2 py-1 text-[11px] font-black text-amber-700">
                            資格30日 {attention.soon}
                          </span>
                        )}

                        {attention.events > 0 && (
                          <span className="rounded-lg bg-rose-100 px-2 py-1 text-[11px] font-black text-rose-700">
                            イベント超過 {attention.events}
                          </span>
                        )}

                        {attention.nextInterviews > 0 && (
                          <span className="rounded-lg bg-emerald-100 px-2 py-1 text-[11px] font-black text-emerald-700">
                            次回面談 {attention.nextInterviews}
                          </span>
                        )}
                      </div>
                    </div>

                    <Chip tone="danger">要対応 {attention.total}</Chip>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                今日確認したいこと
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                日々の確認ポイントをまとめています。
              </p>
            </div>
          </div>

          <div className="space-y-3 p-5">
            <ActionCard
              title="通知・リマインドを確認"
              description={`未読通知 ${unreadNotificationCount}件 / 重要 ${dangerNotificationCount}件`}
              href="/notifications"
              danger={unreadNotificationCount > 0}
            />

            <ActionCard
              title="組織・上司・役職の未設定を確認"
              description={`所属未設定 ${organizationUnsetEmployees.length}名 / 上司未設定 ${managerUnsetEmployees.length}名 / 役職未設定 ${positionUnsetEmployees.length}名`}
              href="/manager-overview"
              danger={
                organizationUnsetEmployees.length > 0 ||
                managerUnsetEmployees.length > 0 ||
                positionUnsetEmployees.length > 0
              }
            />

            <ActionCard
              title="上司別の配下社員を確認"
              description={`上司数 ${managerCount}名 / 配下設定済み ${
                activeEmployees.length - managerUnsetEmployees.length
              }名`}
              href="/manager-overview"
              danger={managerUnsetEmployees.length > 0}
            />

            <ActionCard
              title="役職履歴・昇格降格を確認"
              description={`役職履歴 ${positionHistoryCount}件 / 昇格 ${promotionCount}件 / 降格 ${demotionCount}件`}
              href="/employee-analytics"
              danger={demotionCount > 0}
            />

            <ActionCard
              title="資格期限を確認"
              description={`期限切れ ${expiredQualifications.length}件 / 30日以内 ${expiringSoonQualifications.length}件`}
              href="/employees?attention=required"
              danger={
                expiredQualifications.length > 0 ||
                expiringSoonQualifications.length > 0
              }
            />

            <ActionCard
              title="期限超過イベントを確認"
              description={`期限超過 ${overdueEvents.length}件`}
              href="/annual-events?overdue=1"
              danger={overdueEvents.length > 0}
            />

            <ActionCard
              title="次回面談予定を確認"
              description={`次回面談予定 ${pendingInterviews.length}件`}
              href="/employees?attention=required"
              danger={false}
            />

            <ActionCard
              title="未招待社員を確認"
              description="ログイン招待が未送信の社員を確認します。"
              href="/employees?invite=uninvited"
              danger={false}
            />
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

function ActionCard({
  title,
  description,
  href,
  danger,
}: {
  title: string;
  description: string;
  href: string;
  danger: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "block rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-sm",
        danger
          ? "border-rose-200 bg-rose-50"
          : "border-slate-200 bg-slate-50",
      ].join(" ")}
    >
      <div
        className={[
          "text-sm font-black",
          danger ? "text-rose-700" : "text-slate-900",
        ].join(" ")}
      >
        {title}
      </div>

      <div
        className={[
          "mt-1 text-sm font-semibold",
          danger ? "text-rose-600" : "text-slate-500",
        ].join(" ")}
      >
        {description}
      </div>
    </Link>
  );
}

function getNotificationHref(n: any) {
  if (n.related_type === "employee_annual_event" && n.related_id) {
    return `/annual-events/${n.related_id}`;
  }

  if (n.related_type === "employee_qualification") {
    return "/employees?attention=required";
  }

  return "/notifications";
}

function getNotificationTone(severity: string) {
  if (severity === "danger") return "danger";
  if (severity === "warning") return "danger";
  if (severity === "info") return "info";
  return "gray";
}

function getNotificationSeverityLabel(severity: string) {
  if (severity === "danger") return "重要";
  if (severity === "warning") return "注意";
  if (severity === "info") return "情報";
  return severity || "通常";
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return value;

  return d.toLocaleString("ja-JP");
}