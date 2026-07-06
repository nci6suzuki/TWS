// src/app/(protected)/employees/new/page.tsx

import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseServerDbClient } from "@/lib/supabase/server-db";
import { PageShell } from "@/components/ui/page-shell";
import { Hero, Card, Chip, GhostButton } from "@/components/ui/ux";
import { buttonClassName } from "@/lib/ui/button-class";
import { SubmitButton } from "@/components/ui/submit-button";

export default async function EmployeeNewPage() {
  const me = await requireAuth();

  if (me.role !== "admin" && me.role !== "hr") {
    redirect("/unauthorized");
  }

  async function createEmployee(formData: FormData) {
    "use server";

    const supabase = await createSupabaseServerDbClient();

    const payload = {
      employee_code: String(formData.get("employee_code") ?? "").trim(),
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      app_role: String(formData.get("app_role") ?? "employee"),
      status: String(formData.get("status") ?? "active"),
      employment_type: String(formData.get("employment_type") ?? "full_time"),
    };

    if (!payload.employee_code || !payload.name || !payload.email) {
      redirect(
        `/employees/new?error=${encodeURIComponent(
          "社員番号・氏名・メールは必須です"
        )}`
      );
    }

    const { error } = await supabase.from("employees").insert(payload);

    if (error) {
      redirect(`/employees/new?error=${encodeURIComponent(error.message)}`);
    }

    redirect(`/employees?created=${encodeURIComponent(payload.name)}`);
  }

  return (
    <PageShell>
      <div className="space-y-6">
        <Hero
          title="社員登録"
          subtitle="社員番号・氏名・メール・権限・在籍状態を登録します。"
          meta={
            <div className="flex flex-wrap gap-2">
              <Chip tone="info">Create Employee</Chip>
              <Chip>登録権限: {me.role}</Chip>
              <Chip tone="gray">最小フォーム</Chip>
            </div>
          }
          right={
            <>
              <GhostButton href="/employees">社員一覧へ戻る</GhostButton>
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
                    必須項目を入力して、社員情報を登録してください。
                  </p>
                </div>

                <Chip tone="gray">Employee</Chip>
              </div>
            </div>

            <form action={createEmployee} className="p-5 md:p-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="社員番号" name="employee_code" required />
                <Field label="氏名" name="name" required />
                <Field label="メール" name="email" required type="email" />

                <Select
                  label="ロール"
                  name="app_role"
                  options={[
                    ["employee", "employee"],
                    ["mentor", "mentor"],
                    ["manager", "manager"],
                    ["hr", "hr"],
                    ["admin", "admin"],
                  ]}
                />

                <Select
                  label="在籍状態"
                  name="status"
                  options={[
                    ["active", "active"],
                    ["leave", "leave"],
                    ["inactive", "inactive"],
                  ]}
                />

                <Select
                  label="雇用区分"
                  name="employment_type"
                  options={[
                    ["full_time", "full_time"],
                    ["contract", "contract"],
                    ["part_time", "part_time"],
                    ["other", "other"],
                  ]}
                />
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs font-medium text-slate-400">
                  登録後は社員一覧へ移動します。
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/employees"
                    className={buttonClassName(
                      "inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
                    )}
                  >
                    キャンセル
                  </Link>

                  <SubmitButton
                    pendingText="登録中..."
                    className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-6 text-sm font-bold text-white shadow-sm hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md"
                  >
                    登録する
                  </SubmitButton>
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
                    社員カルテや権限制御に利用されます。
                  </p>
                </div>

                <Chip tone="info">Guide</Chip>
              </div>

              <div className="mt-5 space-y-3">
                <GuideItem
                  title="1. 社員番号は一意にする"
                  description="社員詳細ページのURLや検索に使うため、重複しない番号を登録してください。"
                />
                <GuideItem
                  title="2. メールはログイン連携に使用"
                  description="認証ユーザーとの紐づけや通知機能で利用する想定です。"
                />
                <GuideItem
                  title="3. ロールは権限に影響"
                  description="admin / hr / manager などは閲覧・登録範囲に関係するため慎重に設定してください。"
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
                    この画面はあとから強化できます。
                  </p>
                </div>

                <Chip tone="gray">Next</Chip>
              </div>

              <div className="mt-5 space-y-2 text-sm font-medium leading-6 text-slate-600">
                <p>・支店、部署、役職をマスタから選択</p>
                <p>・社員登録時に年間イベントテンプレートを適用</p>
                <p>・資格情報、キャリア希望、面談予定を同時登録</p>
                <p>・招待メール送信と初回ログイン設定</p>
              </div>
            </Card>
          </div>
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