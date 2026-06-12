// src/app/(protected)/dashboard/page.tsx

import Link from "next/link";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseServerDbClient } from "@/lib/supabase/server-db";
import { PageShell } from "@/components/ui/page-shell";
import { Hero, KPI, Card, Chip, PrimaryButton } from "@/components/ui/ux";

export const runtime = "nodejs";

export default async function DashboardPage() {
  const me = await requireAuth();
  const supabase = await createSupabaseServerDbClient();

  const today = new Date().toISOString().slice(0, 10);

  const alertDateObj = new Date();
  alertDateObj.setDate(alertDateObj.getDate() + 30);
  const alertDate = alertDateObj.toISOString().slice(0, 10);

  const { data: employees, error: employeesError } = await supabase
    .from("employees")
    .select("id, employee_code, name, email, status, app_role")
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

  const allEmployees = employees ?? [];
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

  const loadError =
    qualificationsError?.message ??
    annualEventsError?.message ??
    interviewsError?.message ??
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

  const activeEmployees = allEmployees.filter((e) => e.status === "active");
  const inactiveEmployees = allEmployees.filter((e) => e.status !== "active");

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
        subtitle="社員カルテ、資格、年間イベント、面談予定の要対応状況を確認できます。"
        meta={
          <div className="flex flex-wrap gap-2">
            <Chip tone="info">Talent Management</Chip>
            <Chip>ログイン権限: {me.role}</Chip>
            <Chip>社員数: {allEmployees.length}</Chip>
          </div>
        }
        right={
          <>
            <PrimaryButton href="/employees">社員一覧</PrimaryButton>
            <PrimaryButton href="/employees?attention=required">
              要対応社員を見る
            </PrimaryButton>
            <PrimaryButton href="/annual-events">年間イベント</PrimaryButton>
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

      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
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
        />
        <KPI
          label="次回面談予定"
          value={pendingInterviews.length}
          tone={pendingInterviews.length > 0 ? "ok" : "ok"}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <KPI label="社員数" value={allEmployees.length} />
        <KPI label="在籍中" value={activeEmployees.length} tone="ok" />
        <KPI
          label="休職・退職等"
          value={inactiveEmployees.length}
          tone={inactiveEmployees.length > 0 ? "danger" : "ok"}
        />
      </div>

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
                className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
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
                        className="font-black text-slate-900 hover:underline"
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