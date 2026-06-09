import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseServerDbClient } from "@/lib/supabase/server-db";
import { PageShell } from "@/components/ui/page-shell";
import { Hero, Card, Chip, GhostButton } from "@/components/ui/ux";

export default async function AnnualEventNewPage() {
  const me = await requireAuth();

  if (!["admin", "hr", "manager", "mentor"].includes(me.role)) {
    redirect("/unauthorized");
  }

  const supabase = await createSupabaseServerDbClient();

  const { data: employees, error: empErr } = await supabase
    .from("employees")
    .select("id, employee_code, name")
    .order("employee_code", { ascending: true })
    .limit(300);

  if (empErr) {
    return (
      <PageShell>
        <Card className="p-6">
          <div className="text-xl font-black text-slate-900">
            イベント登録
          </div>
          <div className="mt-2 text-sm font-semibold text-rose-600">
            社員の取得に失敗：{empErr.message}
          </div>
        </Card>
      </PageShell>
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

    const { error } = await supabase
      .from("employee_annual_events")
      .insert(payload);

    if (error) {
      redirect(`/annual-events/new?error=${encodeURIComponent(error.message)}`);
    }

    redirect("/annual-events");
  }

  return (
    <PageShell>
      <Hero
        title="イベント登録"
        subtitle="社員ごとの面談・研修・評価・オンボーディング予定を登録します。"
        meta={
          <div className="flex flex-wrap gap-2">
            <Chip tone="info">Create Mode</Chip>
            <Chip>登録権限: {me.role}</Chip>
            <Chip>社員候補: {employees?.length ?? 0}名</Chip>
          </div>
        }
        right={
          <>
            <GhostButton href="/annual-events">一覧へ戻る</GhostButton>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4 md:px-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  登録フォーム
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  必須項目を入力して、年間イベントを登録してください。
                </p>
              </div>

              <Chip tone="gray">Annual Event</Chip>
            </div>
          </div>

          <form action={createEvent} className="p-5 md:p-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <label className="grid gap-2 md:col-span-2">
                <span className="text-sm font-black text-slate-700">
                  対象社員 <span className="text-rose-600">*</span>
                </span>
                <select
                  name="employee_id"
                  required
                  className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                >
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

              <label className="grid gap-2">
                <span className="text-sm font-black text-slate-700">
                  担当者（社員ID / 任意）
                </span>
                <input
                  name="owner_employee_id"
                  className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  placeholder="uuid（後でpicker化）"
                />
              </label>

              <label className="grid gap-2 md:col-span-2">
                <span className="text-sm font-black text-slate-700">
                  説明（任意）
                </span>
                <textarea
                  name="description"
                  className="min-h-[150px] rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  placeholder="イベントの補足説明や対応メモを入力してください。"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs font-medium text-slate-400">
                登録後は年間イベント一覧へ移動します。
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/annual-events"
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
                >
                  キャンセル
                </Link>

                <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-6 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md">
                  登録する
                </button>
              </div>
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  登録のポイント
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  ダッシュボードや期限管理に反映されます。
                </p>
              </div>
              <Chip tone="info">Guide</Chip>
            </div>

            <div className="mt-5 space-y-3">
              <GuideItem
                title="1. 予定日を正確に入力"
                description="期限超過の判定に使われるため、予定日は正しく登録してください。"
              />
              <GuideItem
                title="2. 状態は基本 pending"
                description="登録時は未完了の pending にしておくと、完了管理がしやすくなります。"
              />
              <GuideItem
                title="3. 優先度を使い分け"
                description="重要な面談や評価は優先度1にして、対応漏れを防ぎます。"
              />
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  今後の拡張候補
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  この画面はあとから便利にできます。
                </p>
              </div>
              <Chip tone="gray">Next</Chip>
            </div>

            <div className="mt-5 space-y-2 text-sm font-medium leading-6 text-slate-600">
              <p>・担当者を社員ピッカーから選択</p>
              <p>・テンプレートから一括作成</p>
              <p>・新卒 / 中途 / 役職別イベント自動生成</p>
              <p>・登録後に社員カルテへ紐づけ表示</p>
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
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
    <label className="grid gap-2">
      <span className="text-sm font-black text-slate-700">
        {label} {required ? <span className="text-rose-600">*</span> : null}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
      />
    </label>
  );
}

function Select({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: Array<[string, string]>;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-slate-700">{label}</span>
      <select
        name={name}
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

function GuideItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="text-sm font-black text-slate-900">{title}</div>
      <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}