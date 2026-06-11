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
  await requireAuth();

  const { id } = await params;
  const admin = createSupabaseAdminClient();

  const { data: event, error } = await admin
    .from("employee_annual_events")
    .select(
      "id, employee_id, title, event_type, scheduled_date, status, priority, description, source_type, source_id, created_at"
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

  const isFromInterview =
    event.source_type === "employee_interview" && !!event.source_id;

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <Card className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-xs font-black tracking-[0.18em] text-indigo-600">
                ANNUAL EVENT
              </div>
              <h1 className="mt-2 text-3xl font-black text-slate-900">
                {event.title}
              </h1>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                年間イベントの詳細情報を確認できます。
              </p>
            </div>

<div className="flex flex-wrap gap-2">
  <Chip tone={event.status === "done" ? "ok" : "info"}>
    {event.status}
  </Chip>

  <Chip>{event.event_type}</Chip>

  <Link
    href={`/annual-events/${event.id}/edit`}
    className="inline-flex h-9 items-center rounded-xl bg-slate-900 px-4 text-sm font-black text-white hover:bg-slate-800"
  >
    編集
  </Link>

<DeleteAnnualEventButton
  eventId={event.id}
  returnTo="/annual-events"
  size="md"
/>

  <Link
    href="/annual-events"
    className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
  >
    一覧へ戻る
  </Link>
</div>
          </div>
        </Card>

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
                href={`/employees/code/${employee.employee_code}/interviews/${event.source_id}/edit`}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-black text-white hover:bg-indigo-700"
              >
                元の面談履歴を開く
              </Link>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
              優先度
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">
              {event.priority}
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-xs font-black tracking-[0.12em] text-slate-500">
              種別
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">
              {event.event_type}
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-black text-slate-900">対象社員</h2>

          {employee ? (
            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-black text-slate-900">
                    {employee.name}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-500">
                    {employee.employee_code} / {employee.email ?? "-"}
                  </div>
                </div>

                <Link
                  href={`/employees/code/${employee.employee_code}`}
                  className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
                >
                  社員カルテ
                </Link>
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
      </div>
    </PageShell>
  );
}