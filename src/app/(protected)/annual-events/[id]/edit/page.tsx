import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PageShell } from "@/components/ui/page-shell";
import { Card, Chip } from "@/components/ui/ux";

export const runtime = "nodejs";

export default async function AnnualEventEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const me = await requireAuth();
  const { id } = await params;
  const sp = await searchParams;

  const errorParam = sp.error;
  const errorMessage = Array.isArray(errorParam)
    ? errorParam[0] ?? ""
    : errorParam ?? "";

  if (me.role !== "admin" && me.role !== "hr") {
    redirect("/unauthorized");
  }

  const admin = createSupabaseAdminClient();

  const { data: event, error } = await admin
    .from("employee_annual_events")
    .select(
      "id, employee_id, title, event_type, scheduled_date, status, priority, description, source_type, source_id"
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

  async function updateAnnualEvent(formData: FormData) {
    "use server";

    const me = await requireAuth();
    if (me.role !== "admin" && me.role !== "hr") {
      redirect("/unauthorized");
    }

    const admin = createSupabaseAdminClient();

    const eventId = String(formData.get("event_id") ?? "").trim();

    const title = String(formData.get("title") ?? "").trim();
    const eventType = String(formData.get("event_type") ?? "other").trim();
    const scheduledDate = String(
      formData.get("scheduled_date") ?? ""
    ).trim();
    const status = String(formData.get("status") ?? "pending").trim();
    const priorityRaw = String(formData.get("priority") ?? "2").trim();
    const description = String(formData.get("description") ?? "").trim();

    const priority = Number(priorityRaw || 2);

    if (!eventId) {
      redirect("/annual-events");
    }

    if (!title || !scheduledDate) {
      redirect(
        `/annual-events/${eventId}/edit?error=${encodeURIComponent(
          "タイトルと予定日は必須です"
        )}`
      );
    }

    const { data: currentEvent, error: currentError } = await admin
      .from("employee_annual_events")
      .select("id, source_type, source_id")
      .eq("id", eventId)
      .maybeSingle();

    if (currentError || !currentEvent) {
      redirect(
        `/annual-events/${eventId}/edit?error=${encodeURIComponent(
          currentError?.message ?? "年間イベントが見つかりません"
        )}`
      );
    }

    const completedAt =
      status === "done" ? new Date().toISOString() : null;

    const { error: updateError } = await admin
      .from("employee_annual_events")
      .update({
        title,
        event_type: eventType,
        scheduled_date: scheduledDate,
        status,
        priority,
        description,
        completed_at: completedAt,
      })
      .eq("id", eventId);

    if (updateError) {
      redirect(
        `/annual-events/${eventId}/edit?error=${encodeURIComponent(
          updateError.message
        )}`
      );
    }

    /**
     * 面談履歴から作られたイベントの場合、
     * 予定日の変更を面談履歴側の next_interview_date に反映
     */
    if (
      currentEvent.source_type === "employee_interview" &&
      currentEvent.source_id
    ) {
      if (status === "done") {
        const { error: interviewDoneError } = await admin
          .from("employee_interviews")
          .update({
            next_interview_completed_at: completedAt,
            next_interview_completed_event_id: eventId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentEvent.source_id);

        if (interviewDoneError) {
          redirect(
            `/annual-events/${eventId}/edit?error=${encodeURIComponent(
              interviewDoneError.message
            )}`
          );
        }
      } else {
        const { error: interviewUpdateError } = await admin
          .from("employee_interviews")
          .update({
            next_interview_date: scheduledDate,
            next_interview_completed_at: null,
            next_interview_completed_event_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentEvent.source_id);

        if (interviewUpdateError) {
          redirect(
            `/annual-events/${eventId}/edit?error=${encodeURIComponent(
              interviewUpdateError.message
            )}`
          );
        }
      }
    }

    redirect(`/annual-events/${eventId}`);
  }

  const isFromInterview =
    event.source_type === "employee_interview" && !!event.source_id;

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-xs font-black tracking-[0.18em] text-indigo-600">
                ANNUAL EVENT EDIT
              </div>
              <h1 className="mt-2 text-3xl font-black text-slate-900">
                年間イベント編集
              </h1>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                予定日、状態、優先度、説明を編集できます。
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {employee && <Chip tone="info">{employee.employee_code}</Chip>}
              {isFromInterview && <Chip tone="info">面談連動</Chip>}
              <Link
                href={`/annual-events/${event.id}`}
                className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
              >
                詳細へ戻る
              </Link>
            </div>
          </div>
        </Card>

        {errorMessage && (
          <Card className="border-rose-200 bg-rose-50 p-5">
            <div className="text-sm font-black text-rose-700">
              エラーが発生しました
            </div>
            <div className="mt-1 text-sm font-semibold text-rose-600">
              {errorMessage}
            </div>
          </Card>
        )}

        {employee && (
          <Card className="p-5">
            <div className="text-xs font-black tracking-[0.12em] text-slate-500">
              対象社員
            </div>
            <div className="mt-2 text-lg font-black text-slate-900">
              {employee.name}
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-500">
              {employee.employee_code} / {employee.email ?? "-"}
            </div>
          </Card>
        )}

        <form action={updateAnnualEvent} className="space-y-6">
          <input type="hidden" name="event_id" value={event.id} />

          <Card className="p-6">
            <h2 className="text-xl font-black text-slate-900">
              イベント情報
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              年間イベントの基本情報を編集します。
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="タイトル">
                <input
                  name="title"
                  defaultValue={event.title ?? ""}
                  required
                  className="input"
                  placeholder="例：次回面談"
                />
              </Field>

              <Field label="種別">
                <select
                  name="event_type"
                  defaultValue={event.event_type ?? "other"}
                  className="input"
                >
                  <option value="interview">面談</option>
                  <option value="training">研修</option>
                  <option value="evaluation">評価</option>
                  <option value="qualification">資格</option>
                  <option value="contract">契約・更新</option>
                  <option value="other">その他</option>
                </select>
              </Field>

              <Field label="予定日">
                <input
                  name="scheduled_date"
                  type="date"
                  defaultValue={event.scheduled_date ?? ""}
                  required
                  className="input"
                />
              </Field>

              <Field label="状態">
                <select
                  name="status"
                  defaultValue={event.status ?? "pending"}
                  className="input"
                >
                  <option value="pending">pending</option>
                  <option value="done">done</option>
                  <option value="canceled">canceled</option>
                </select>
              </Field>

              <Field label="優先度">
                <select
                  name="priority"
                  defaultValue={String(event.priority ?? 2)}
                  className="input"
                >
                  <option value="1">1 高</option>
                  <option value="2">2 通常</option>
                  <option value="3">3 低</option>
                </select>
              </Field>

              <div className="md:col-span-2">
                <Field label="説明">
                  <textarea
                    name="description"
                    rows={5}
                    defaultValue={event.description ?? ""}
                    className="input"
                    placeholder="内容、注意点、次回アクションなど"
                  />
                </Field>
              </div>
            </div>
          </Card>

          {isFromInterview && (
            <Card className="border-indigo-200 bg-indigo-50 p-5">
              <div className="text-sm font-black text-indigo-700">
                面談履歴と連動しています
              </div>
              <div className="mt-1 text-sm font-semibold text-indigo-600">
                予定日を変更すると、元の面談履歴の「次回面談予定日」も更新されます。
                状態を done にすると、面談履歴側に完了情報が反映されます。
              </div>
            </Card>
          )}

          <div className="flex flex-col gap-3 md:flex-row md:justify-end">
            <Link
              href={`/annual-events/${event.id}`}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              キャンセル
            </Link>

            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-6 text-sm font-black text-white hover:bg-slate-800"
            >
              保存する
            </button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-sm font-black text-slate-700">{label}</div>
      <div className="mt-2">{children}</div>
    </label>
  );
}