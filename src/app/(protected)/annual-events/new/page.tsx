import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseServerDbClient } from "@/lib/supabase/server-db";

export default async function AnnualEventNewPage() {
  const me = await requireAuth();
  // admin/hr/manager/mentor は作れる想定（RLS側もそれに合わせてある前提）
  if (!["admin", "hr", "manager", "mentor"].includes(me.role)) redirect("/unauthorized");

  const supabase = await createSupabaseServerDbClient();

  // 対象社員の候補（RLSで見える範囲だけ出る）
  const { data: employees, error: empErr } = await supabase
    .from("employees")
    .select("id, employee_code, name")
    .order("employee_code", { ascending: true })
    .limit(300);

  if (empErr) {
    return (
      <div className="rounded-2xl border bg-white p-6">
        <div className="text-xl font-bold">イベント登録</div>
        <div className="mt-2 text-sm text-rose-600">社員の取得に失敗：{empErr.message}</div>
      </div>
    );
  }

  async function createEvent(formData: FormData) {
    "use server";
    const supabase = await createSupabaseServerDbClient();

    const payload = {
      employee_id: String(formData.get("employee_id") ?? ""),
      title: String(formData.get("title") ?? "").trim(),
      event_type: String(formData.get("event_type") ?? "other"),
      scheduled_date: String(formData.get("scheduled_date") ?? ""),
      owner_employee_id: String(formData.get("owner_employee_id") ?? "") || null,
      priority: Number(formData.get("priority") ?? 2),
      status: String(formData.get("status") ?? "pending"),
      description: String(formData.get("description") ?? "").trim() || null,
    };

    const { error } = await supabase.from("employee_annual_events").insert(payload);
    if (error) redirect(`/annual-events/new?error=${encodeURIComponent(error.message)}`);

    redirect("/annual-events");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-6">
        <div className="text-2xl font-bold">イベント登録</div>
        <div className="mt-2 text-sm text-slate-600">
          最小フォーム（後でテンプレ/担当者ピッカー等に拡張）
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6">
        <form action={createEvent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="grid gap-1 md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">
              対象社員 <span className="text-rose-600">*</span>
            </span>
            <select name="employee_id" required className="rounded-xl border p-3 text-sm bg-white">
              <option value="">選択してください</option>
              {(employees ?? []).map((e) => (
                <option key={e.id} value={e.id}>
                  {e.employee_code} - {e.name}
                </option>
              ))}
            </select>
          </label>

          <Field label="タイトル" name="title" required />
          <Field label="予定日" name="scheduled_date" required type="date" />

          <Select
            label="種別"
            name="event_type"
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
            options={[
              ["pending", "pending"],
              ["done", "done"],
              ["canceled", "canceled"],
            ]}
          />

          <Select
            label="優先度"
            name="priority"
            options={[
              ["1", "1（高）"],
              ["2", "2（中）"],
              ["3", "3（低）"],
            ]}
          />

          <label className="grid gap-1">
            <span className="text-sm font-semibold text-slate-700">担当者（社員ID/任意）</span>
            <input name="owner_employee_id" className="rounded-xl border p-3 text-sm" placeholder="uuid（後でpicker化）" />
          </label>

          <label className="grid gap-1 md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">説明（任意）</span>
            <textarea name="description" className="rounded-xl border p-3 text-sm min-h-[110px]" />
          </label>

          <div className="md:col-span-2 flex gap-2 pt-2">
            <button className="h-11 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800">
              登録
            </button>
            <a
              href="/annual-events"
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
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-semibold text-slate-700">
        {label} {required ? <span className="text-rose-600">*</span> : null}
      </span>
      <input name={name} type={type} required={required} className="rounded-xl border p-3 text-sm" />
    </label>
  );
}

function Select({ label, name, options }: { label: string; name: string; options: Array<[string, string]> }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <select name={name} className="rounded-xl border p-3 text-sm bg-white">
        {options.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}