import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseServerDbClient } from "@/lib/supabase/server-db";
import { PageShell } from "@/components/ui/page-shell";
import { Hero, Card, Chip, PrimaryButton, GhostButton } from "@/components/ui/ux";

export default async function AnnualEventEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;

  const supabase = await createSupabaseServerDbClient();

  const { data: event, error } = await supabase
    .from("employee_annual_events")
    .select("id, title, scheduled_date, event_type, status, priority, description")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!event) return notFound();

  async function updateEvent(formData: FormData) {
    "use server";

    const supabase = await createSupabaseServerDbClient();

    const patch = {
      title: String(formData.get("title") ?? "").trim(),
      scheduled_date: String(formData.get("scheduled_date") ?? ""),
      event_type: String(formData.get("event_type") ?? "other"),
      status: String(formData.get("status") ?? "pending"),
      priority: Number(formData.get("priority") ?? 2),
      description: String(formData.get("description") ?? "").trim() || null,
    };

    const { error } = await supabase
      .from("employee_annual_events")
      .update(patch)
      .eq("id", id);

    if (error) throw error;

    redirect(`/annual-events/${id}`);
  }

  return (
    <PageShell>
      <Hero
        title="年間イベント 編集"
        subtitle="タイトル・予定日・状態・説明を更新できます。保存後は詳細画面へ戻ります。"
        meta={
          <div className="flex flex-wrap gap-2">
            <Chip tone="info">Edit Mode</Chip>
            <Chip>種別: {event.event_type}</Chip>
            <Chip tone={event.status === "done" ? "ok" : "gray"}>
              状態: {event.status}
            </Chip>
            <Chip>優先度: {event.priority}</Chip>
          </div>
        }
        right={
          <>
            <GhostButton href={`/annual-events/${id}`}>詳細へ戻る</GhostButton>
            <GhostButton href="/annual-events">一覧へ戻る</GhostButton>
          </>
        }
      />

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4 md:px-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                編集フォーム
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                必須項目を確認し、必要に応じて内容を更新してください。
              </p>
            </div>

            <Chip tone="gray">Annual Event</Chip>
          </div>
        </div>

        <form action={updateEvent} className="p-5 md:p-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field
              label="タイトル"
              name="title"
              required
              defaultValue={event.title}
            />

            <Field
              label="予定日"
              name="scheduled_date"
              required
              type="date"
              defaultValue={String(event.scheduled_date)}
            />

            <Select
              label="種別"
              name="event_type"
              defaultValue={event.event_type}
              options={[
                ["onboarding", "onboarding"],
                ["training", "training"],
                ["interview", "interview"],
                ["evaluation", "evaluation"],
                ["other", "other"],
              ]}
            />

            <Select
              label="状態"
              name="status"
              defaultValue={event.status}
              options={[
                ["pending", "pending"],
                ["done", "done"],
                ["canceled", "canceled"],
              ]}
            />

            <Select
              label="優先度"
              name="priority"
              defaultValue={String(event.priority)}
              options={[
                ["1", "1（高）"],
                ["2", "2（中）"],
                ["3", "3（低）"],
              ]}
            />

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-black text-slate-900">
                入力の目安
              </div>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                予定日・状態・優先度を正しく更新することで、ダッシュボードや期限超過の判定に反映されます。
              </p>
            </div>

            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-black text-slate-700">
                説明
              </span>
              <textarea
                name="description"
                defaultValue={event.description ?? ""}
                className="min-h-[160px] rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                placeholder="イベントの補足説明や対応メモを入力してください。"
              />
            </label>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs font-medium text-slate-400">
              保存すると、年間イベント詳細画面へ移動します。
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/annual-events/${id}`}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
              >
                キャンセル
              </Link>

              <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-6 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md">
                保存する
              </button>
            </div>
          </div>
        </form>
      </Card>
    </PageShell>
  );
}

function Field({
  label,
  name,
  required,
  type = "text",
  defaultValue,
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-slate-700">
        {label} {required ? <span className="text-rose-600">*</span> : null}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
      />
    </label>
  );
}

function Select({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: Array<[string, string]>;
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-slate-700">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
      >
        {options.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}