import { redirect, notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseServerDbClient } from "@/lib/supabase/server-db";

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

    const { error } = await supabase.from("employee_annual_events").update(patch).eq("id", id);
    if (error) throw error;

    redirect(`/annual-events/${id}`);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-6">
        <div className="text-2xl font-bold">年間イベント 編集</div>
        <div className="mt-2 text-sm text-slate-600">{event.title}</div>
      </div>

      <div className="rounded-2xl border bg-white p-6">
        <form action={updateEvent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="タイトル" name="title" required defaultValue={event.title} />
          <Field label="予定日" name="scheduled_date" required type="date" defaultValue={String(event.scheduled_date)} />

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

          <label className="grid gap-1 md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">説明</span>
            <textarea
              name="description"
              defaultValue={event.description ?? ""}
              className="rounded-xl border p-3 text-sm min-h-[120px]"
            />
          </label>

          <div className="md:col-span-2 flex gap-2 pt-2">
            <button className="h-11 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800">
              保存
            </button>
            <a
              href={`/annual-events/${id}`}
              className="h-11 inline-flex items-center rounded-xl border bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              戻る
            </a>
          </div>
        </form>
      </div>
    </div>
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
    <label className="grid gap-1">
      <span className="text-sm font-semibold text-slate-700">
        {label} {required ? <span className="text-rose-600">*</span> : null}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="rounded-xl border p-3 text-sm"
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
    <label className="grid gap-1">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <select name={name} defaultValue={defaultValue} className="rounded-xl border p-3 text-sm bg-white">
        {options.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}