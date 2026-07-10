// src/app/(protected)/employees/new/page.tsx

import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseServerDbClient } from "@/lib/supabase/server-db";
import { PageShell } from "@/components/ui/page-shell";
import { Hero, Card, Chip, GhostButton } from "@/components/ui/ux";
import { buttonClassName } from "@/lib/ui/button-class";
import { SubmitButton } from "@/components/ui/submit-button";

export const runtime = "nodejs";

type OrganizationUnitRow = {
  id: string;
  name: string;
  sort_order: number | null;
  is_active: boolean | null;
};

type EmployeeOptionRow = {
  id: string;
  employee_code: string;
  name: string;
  status: string | null;
};

type PositionMasterRow = {
  id: string;
  name: string;
  rank_order: number | null;
  is_management_role: boolean | null;
  is_active: boolean | null;
};

export default async function EmployeeNewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const me = await requireAuth();
  const sp = await searchParams;

  if (me.role !== "admin" && me.role !== "hr") {
    redirect("/unauthorized");
  }

  const getParam = (key: string) => {
    const v = sp[key];
    return Array.isArray(v) ? v[0] ?? "" : v ?? "";
  };

  const errorMessage = getParam("error");

  const supabase = await createSupabaseServerDbClient();

  const [
    { data: organizationUnits, error: organizationError },
    { data: employeeOptions, error: employeeOptionsError },
    { data: positionMasters, error: positionMastersError },
  ] = await Promise.all([
    supabase
      .from("organization_units")
      .select("id, name, sort_order, is_active")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("employees")
      .select("id, employee_code, name, status")
      .order("employee_code", { ascending: true })
      .limit(5000),
    supabase
      .from("position_masters")
      .select("id, name, rank_order, is_management_role, is_active")
      .eq("is_active", true)
      .order("rank_order", { ascending: true })
      .order("name", { ascending: true }),
  ]);

  if (organizationError) {
    return (
      <PageShell>
        <Card className="p-6">
          <div className="text-xl font-black text-slate-900">社員登録</div>
          <div className="mt-2 text-sm font-semibold text-rose-600">
            所属組織の読み込みに失敗：{organizationError.message}
          </div>
        </Card>
      </PageShell>
    );
  }

  if (employeeOptionsError) {
    return (
      <PageShell>
        <Card className="p-6">
          <div className="text-xl font-black text-slate-900">社員登録</div>
          <div className="mt-2 text-sm font-semibold text-rose-600">
            直属上司候補の読み込みに失敗：{employeeOptionsError.message}
          </div>
        </Card>
      </PageShell>
    );
  }

  if (positionMastersError) {
    return (
      <PageShell>
        <Card className="p-6">
          <div className="text-xl font-black text-slate-900">社員登録</div>
          <div className="mt-2 text-sm font-semibold text-rose-600">
            役職マスタの読み込みに失敗：{positionMastersError.message}
          </div>
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-700">
            先に Supabase SQL Editor で position_masters テーブル作成SQLを実行してください。
          </div>
        </Card>
      </PageShell>
    );
  }

  const organizations = ((organizationUnits ?? []) as OrganizationUnitRow[]).filter(
    (org) => org.is_active !== false
  );

  const managerOptions = (employeeOptions ?? []) as EmployeeOptionRow[];
  const positions = (positionMasters ?? []) as PositionMasterRow[];

  async function createEmployee(formData: FormData) {
    "use server";

    const me = await requireAuth();

    if (me.role !== "admin" && me.role !== "hr") {
      redirect("/unauthorized");
    }

    const supabase = await createSupabaseServerDbClient();

    const positionTitle = normalizeText(formData.get("position_title"));
    const positionStartedOn = normalizeDate(
      String(formData.get("position_started_on") ?? "")
    );

    if (positionTitle && !positionStartedOn) {
      redirect(
        `/employees/new?error=${encodeURIComponent(
          "初期役職を登録する場合は、役職開始日を入力してください"
        )}`
      );
    }

    const selectedPosition = positionTitle
      ? await findPositionByName(positionTitle)
      : null;

    const isManagementRoleFromPosition =
      selectedPosition?.is_management_role === true;

    const payload = {
      employee_code: String(formData.get("employee_code") ?? "").trim(),
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      app_role: String(formData.get("app_role") ?? "employee"),
      status: String(formData.get("status") ?? "active"),
      employment_type: String(formData.get("employment_type") ?? "full_time"),

      organization_unit_id: normalizeText(formData.get("organization_unit_id")),
      manager_employee_id: normalizeText(formData.get("manager_employee_id")),

      position_title: positionTitle,
      position_started_on: positionStartedOn,

      birth_date: normalizeDate(String(formData.get("birth_date") ?? "")),
      gender: normalizeText(formData.get("gender")) ?? "unknown",
      is_management_role:
        formData.get("is_management_role") === "on" ||
        isManagementRoleFromPosition,
    };

    if (!payload.employee_code || !payload.name || !payload.email) {
      redirect(
        `/employees/new?error=${encodeURIComponent(
          "社員番号・氏名・メールは必須です"
        )}`
      );
    }

    const { data: createdEmployee, error } = await supabase
      .from("employees")
      .insert(payload)
      .select("id, employee_code, name")
      .single();

    if (error) {
      redirect(`/employees/new?error=${encodeURIComponent(error.message)}`);
    }

    if (payload.position_title && payload.position_started_on) {
      const { error: positionHistoryError } = await supabase
        .from("employee_position_histories")
        .insert({
          employee_id: createdEmployee.id,
          position_title: payload.position_title,
          change_type: "appointed",
          started_on: payload.position_started_on,
          ended_on: null,
          previous_position_title: null,
          reason: "初期登録",
          memo: null,
          created_by_employee_id: me.employeeId ?? null,
        });

      if (positionHistoryError) {
        redirect(
          `/employees/new?error=${encodeURIComponent(
            `社員は登録されましたが、役職履歴の登録に失敗しました：${positionHistoryError.message}`
          )}`
        );
      }
    }

    redirect(`/employees?created=${encodeURIComponent(payload.name)}`);
  }

  return (
    <PageShell>
      <div className="space-y-6">
        <Hero
          title="社員登録"
          subtitle="社員番号・氏名・メール・権限・在籍状態・所属組織・直属上司・初期役職・分析項目を登録します。"
          meta={
            <div className="flex flex-wrap gap-2">
              <Chip tone="info">Create Employee</Chip>
              <Chip>登録権限: {me.role}</Chip>
              <Chip tone="gray">組織・役職対応</Chip>
              <Chip tone="gray">役職マスタ対応</Chip>
              <Chip tone="gray">分析項目対応</Chip>
            </div>
          }
          right={
            <>
              <GhostButton href="/employees">社員一覧へ戻る</GhostButton>
            </>
          }
        />

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

        {positions.length === 0 && (
          <Card className="border-amber-200 bg-amber-50 p-5">
            <div className="text-sm font-black text-amber-800">
              役職マスタが登録されていません
            </div>
            <div className="mt-1 text-sm font-semibold text-amber-700">
              役職を選択式で登録するには、先に /settings/positions で役職マスタを登録してください。
            </div>
          </Card>
        )}

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
              <div className="space-y-8">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    基本情報
                  </h3>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    社員番号・氏名・メール・ロール・在籍状態を登録します。
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
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
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-base font-black text-slate-900">
                    組織・役職情報
                  </h3>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    所属組織、直属上司、初期役職、役職開始日を登録します。
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                    <Select
                      label="所属組織"
                      name="organization_unit_id"
                      options={[
                        ["", "未設定"],
                        ...organizations.map(
                          (org) => [org.id, org.name] as [string, string]
                        ),
                      ]}
                    />

                    <Select
                      label="直属上司"
                      name="manager_employee_id"
                      options={[
                        ["", "未設定"],
                        ...managerOptions.map(
                          (manager) =>
                            [
                              manager.id,
                              `${manager.employee_code} / ${manager.name}${
                                manager.status && manager.status !== "active"
                                  ? `（${manager.status}）`
                                  : ""
                              }`,
                            ] as [string, string]
                        ),
                      ]}
                    />

                    <Select
                      label="初期役職"
                      name="position_title"
                      options={[
                        ["", "未設定"],
                        ...positions.map(
                          (position) =>
                            [
                              position.name,
                              `${position.name}${
                                position.is_management_role
                                  ? "（役職者扱い）"
                                  : ""
                              }`,
                            ] as [string, string]
                        ),
                      ]}
                    />

                    <Field
                      label="役職開始日"
                      name="position_started_on"
                      type="date"
                    />
                  </div>

                  <div className="mt-4 rounded-2xl border border-indigo-100 bg-white p-4 text-xs font-semibold leading-5 text-slate-500">
                    初期役職と役職開始日を入力すると、登録時に役職履歴へ
                    「任命」として自動登録されます。役職マスタで
                    「役職者扱い」にしている役職を選ぶと、社員分析の役職者フラグも自動でONになります。
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-base font-black text-slate-900">
                    分析項目
                  </h3>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    平均年齢、女性比率、女性役職者率などの社員分析に使用します。
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                    <Field label="生年月日" name="birth_date" type="date" />

                    <Select
                      label="性別"
                      name="gender"
                      options={[
                        ["unknown", "未設定"],
                        ["male", "男性"],
                        ["female", "女性"],
                        ["other", "その他"],
                      ]}
                    />

                    <div className="md:col-span-2">
                      <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                        <input
                          type="checkbox"
                          name="is_management_role"
                          className="mt-1 h-5 w-5 rounded border-slate-300 text-slate-900"
                        />
                        <span>
                          <span className="block text-sm font-black text-slate-900">
                            役職者として集計する
                          </span>
                          <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">
                            役職マスタで「役職者扱い」の役職を選んだ場合は、自動で対象になります。
                            app_role の manager/admin/hr とは別管理です。
                          </span>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs font-medium text-slate-400">
                  登録後は社員一覧へ移動します。初期役職を入力した場合は、役職履歴も作成されます。
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
                    社員カルテ・権限制御・社員分析に利用されます。
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
                  title="2. 所属組織・直属上司を設定する"
                  description="組織別の社員確認や上司配下の管理に利用します。"
                />
                <GuideItem
                  title="3. 初期役職を選択する"
                  description="役職マスタから選択します。初期役職と役職開始日を入力すると、役職履歴に任命履歴が自動登録されます。"
                />
                <GuideItem
                  title="4. 分析項目を入力する"
                  description="生年月日・性別・役職者フラグを入力すると、平均年齢や女性役職者率を正確に集計できます。"
                />
                <GuideItem
                  title="5. ロールは権限に影響"
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
                <p>・社員登録時に年間イベントテンプレートを適用</p>
                <p>・資格情報、キャリア希望、面談予定を同時登録</p>
                <p>・招待メール送信と初回ログイン設定</p>
                <p>・登録完了後にそのまま招待メールを送信</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

async function findPositionByName(name: string) {
  const supabase = await createSupabaseServerDbClient();

  const { data } = await supabase
    .from("position_masters")
    .select("id, name, is_management_role")
    .eq("name", name)
    .maybeSingle();

  return data as { id: string; name: string; is_management_role: boolean } | null;
}

function Field({
  label,
  name,
  required,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
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
        placeholder={placeholder}
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
          <option key={v || "empty"} value={v}>
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

function normalizeText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function normalizeDate(value: string) {
  const text = String(value ?? "").trim();
  return text || null;
}