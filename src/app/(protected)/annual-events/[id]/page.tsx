// src/app/(protected)/annual-events/[id]/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PageShell } from "@/components/ui/page-shell";
import { Card, Chip } from "@/components/ui/ux";
import { DeleteAnnualEventButton } from "@/components/annual-events/delete-annual-event-button";

export const runtime = "nodejs";

export default async function AnnualEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireAuth();

  const { id } = await params;
  const admin = createSupabaseAdminClient();

  const { data: event, error } = await admin
    .from("employee_annual_events")
    .select(
      "id, employee_id, title, event_type, scheduled_date, status, priority, description, source_type, source_id, created_at, completed_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!event) notFound();

  const { data: employee } = await admin
    .from("employees")
    .select("id, employee_code, name, email")
    .eq("id", event.employee_id)
    .maybeSingle();

  const today = new Date().toISOString().slice(0, 10);

  const isOverdue =
    event.status === "pending" && event.scheduled_date < today;

  const isFromInterview =
    event.source_type === "employee_interview" && !!event.source_id;

  const calendarHref = buildCalendarHref({
    scheduledDate: event.scheduled_date,
    employeeCode: employee?.employee_code,
  });

  const listHref = "/annual-events";

  const employeeProfileHref = employee?.employee_code
    ? `/employees/code/${employee.employee_code}?tab=schedule`
    : "/employees";

  const interviewHref =
    isFromInterview && employee?.employee_code
      ? `/employees/code/${employee.employee_code}/interviews/${event.source_id}/edit`
      : "";

  const returnTo = calendarHref;

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <Card className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-xs font-black tracking-[0.18em] text-indigo-600">
                ANNUAL EVENT DETAIL
              </div>

              <h1 className="mt-2 text-3xl font-black text-slate-900">
                {event.title}
              </h1>

              <p className="mt-2 text-sm font-semibold text-slate-500">
                年間イベントの詳細、対象社員、処理状況を確認できます。
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Chip
                  tone={
                    event.status === "done"
                      ? "ok"
                      : isOverdue
                      ? "danger"
                      : "info"
                  }
                >
                  {isOverdue ? "期限超過" : event.status}
                </Chip>

                <Chip>{getEventTypeLabel(event.event_type)}</Chip>

                <Chip>予定日: {event.scheduled_date}</Chip>

                {isFromInterview && <Chip tone="info">面談連動</Chip>}

                {event.completed_at && (
                  <Chip tone="ok">
                    完了日: {formatDateTime(event.completed_at)}
                  </Chip>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={calendarHref}
                className="inline-flex h-9 items-center rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-sm font-black text-indigo-700 hover:bg-indigo-100"
              >
                カレンダーへ戻る
              </Link>

              <Link
                href={listHref}
                className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
              >
                一覧へ戻る
              </Link>

              {employee?.employee_code && (
                <Link
                  href={employeeProfileHref}
                  className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
                >
                  社員カルテへ
                </Link>
              )}

              {(me.role === "admin" || me.role === "hr") && (
                <>
                  <Link
                    href={`/annual-events/${event.id}/edit`}
                    className="inline-flex h-9 items-center rounded-xl bg-slate-900 px-4 text-sm font-black text-white hover:bg-slate-800"
                  >
                    編集
                  </Link>

                  <DeleteAnnualEventButton
                    eventId={event.id}
                    returnTo={returnTo}
                    size="md"
                  />
                </>
              )}
            </div>
          </div>
        </Card>

        {isOverdue && (
          <Card className="border-rose-200 bg-rose-50 p-5">
            <div className="text-sm font-black text-rose-700">
              このイベントは期限超過です
            </div>
            <div className="mt-1 text-sm font-semibold text-rose-600">
              予定日を過ぎています。完了化または予定日の見直しを行ってください。
            </div>
          </Card>
        )}

        {isFromInterview && employee?.employee_code && (
          <Card className="border-indigo-200 bg-indigo-50 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-black text-indigo-700">
                  このイベントは面談履歴から自動作成されました
                </div>
                <div className="mt-1 text-sm font-semibold text-indigo-600">
                  元の面談履歴を確認・編集できます。
                </div>
              </div>

              <Link
                href={interviewHref}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-black text-white hover:bg-indigo-700"
              >
                元の面談履歴を開く
              </Link>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card className="p-5">
            <div className="text-xs font-black tracking-[0.12em] text-slate-500">
              予定日
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">
              {event.scheduled_date}
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-xs font-black tracking-[0.12em] text-slate-500">
              状態
            </div>
            <div className="mt-2">
              <Chip
                tone={
                  event.status === "done"
                    ? "ok"
                    : isOverdue
                    ? "danger"
                    : "info"
                }
              >
                {isOverdue ? "期限超過" : event.status}
              </Chip>
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-xs font-black tracking-[0.12em] text-slate-500">
              優先度
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">
              {getPriorityLabel(event.priority)}
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-xs font-black tracking-[0.12em] text-slate-500">
              種別
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">
              {getEventTypeLabel(event.event_type)}
            </div>
          </Card>
        </div>

        {(me.role === "admin" || me.role === "hr") && event.status !== "done" && (
          <Card className="border-emerald-200 bg-emerald-50 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-black text-emerald-700">
                  このイベントを完了にできます
                </div>
                <div className="mt-1 text-sm font-semibold text-emerald-600">
                  処理が終わった場合は、完了化してください。
                </div>
              </div>

              <form
                action={`/api/annual-events/${event.id}/complete`}
                method="post"
              >
                <input type="hidden" name="returnTo" value={returnTo} />

                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-black text-white hover:bg-emerald-700"
                >
                  完了化する
                </button>
              </form>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <h2 className="text-xl font-black text-slate-900">対象社員</h2>

          {employee ? (
            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-lg font-black text-slate-900">
                    {employee.name}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-500">
                    {employee.employee_code} / {employee.email ?? "-"}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={employeeProfileHref}
                    className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
                  >
                    社員カルテ
                  </Link>

                  <Link
                    href={`/annual-events?employeeCode=${encodeURIComponent(
                      employee.employee_code
                    )}&view=calendar`}
                    className="inline-flex h-9 items-center rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-sm font-black text-indigo-700 hover:bg-indigo-100"
                  >
                    社員別カレンダー
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-sm font-semibold text-slate-500">
              対象社員が見つかりません。
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-black text-slate-900">内容</h2>

          <div className="mt-4 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">
            {event.description || "説明はありません"}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-black text-slate-900">管理情報</h2>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <InfoRow label="イベントID" value={event.id} />
            <InfoRow label="作成日時" value={formatDateTime(event.created_at)} />
            <InfoRow label="連動元種別" value={event.source_type || "-"} />
            <InfoRow label="連動元ID" value={event.source_id || "-"} />
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="text-xs font-black tracking-[0.12em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 break-all text-sm font-bold text-slate-800">
        {value}
      </div>
    </div>
  );
}

function buildCalendarHref({
  scheduledDate,
  employeeCode,
}: {
  scheduledDate: string;
  employeeCode?: string;
}) {
  const d = isValidDateString(scheduledDate)
    ? new Date(scheduledDate)
    : new Date();

  const p = new URLSearchParams();
  p.set("view", "calendar");
  p.set("calendarYear", String(d.getFullYear()));
  p.set("calendarMonth", String(d.getMonth() + 1));

  if (employeeCode) {
    p.set("employeeCode", employeeCode);
  }

  return `/annual-events?${p.toString()}`;
}

function isValidDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;

  return d.toISOString().slice(0, 10) === value;
}

function getEventTypeLabel(type: string) {
  if (type === "interview") return "面談";
  if (type === "training") return "研修";
  if (type === "evaluation") return "評価";
  if (type === "qualification") return "資格";
  if (type === "contract") return "契約・更新";
  if (type === "onboarding") return "入社";
  if (type === "other") return "その他";
  return type || "その他";
}

function getPriorityLabel(priority: number | null) {
  if (priority === 1) return "高";
  if (priority === 2) return "通常";
  if (priority === 3) return "低";
  return priority ? String(priority) : "-";
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return value;

  return d.toLocaleString("ja-JP");
}