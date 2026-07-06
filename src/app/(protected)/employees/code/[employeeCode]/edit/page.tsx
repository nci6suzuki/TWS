// src/app/(protected)/employees/code/[employeeCode]/edit/page.tsx

import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createActivityLog } from "@/lib/activity-logs/create-activity-log";
import { PageShell } from "@/components/ui/page-shell";
import { Card, Chip, PrimaryButton, GhostButton } from "@/components/ui/ux";
import { buttonClassName } from "@/lib/ui/button-class";
import { SubmitButton } from "@/components/ui/submit-button";

export const runtime = "nodejs";

export default async function EmployeeEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ employeeCode: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const me = await requireAuth();
  const { employeeCode } = await params;
  const sp = await searchParams;

  const code = decodeURIComponent(employeeCode).trim();

  const getParam = (key: string) => {
    const v = sp[key];
    return Array.isArray(v) ? v[0] ?? "" : v ?? "";
  };

  const errorMessage = getParam("error");
  const updated = getParam("updated");

  const admin = createSupabaseAdminClient();

  const { data: employee, error: employeeError } = await admin
    .from("employees")
    .select(
      "id, employee_code, name, email, app_role, status, employment_type, hire_date"
    )
    .eq("employee_code", code)
    .maybeSingle();

  if (employeeError) throw employeeError;
  if (!employee) notFound();

  const canEdit =
    me.role === "admin" || me.role === "hr" || me.employeeId === employee.id;

  if (!canEdit) redirect("/unauthorized");

  const canEditRole = me.role === "admin" || me.role === "hr";

  const { data: profile } = await admin
    .from("employee_profiles")
    .select(
      "phone_number, current_address, emergency_contact_name, emergency_contact_phone, profile_memo"
    )
    .eq("employee_id", employee.id)
    .maybeSingle();

  const { data: career } = await admin
    .from("employee_career_goals")
    .select("desired_role, career_goal, skill_notes")
    .eq("employee_id", employee.id)
    .maybeSingle();

  async function updateEmployee(formData: FormData) {
    "use server";

    const me = await requireAuth();
    const admin = createSupabaseAdminClient();

    const targetEmployeeId = String(formData.get("employee_id") ?? "").trim();
    const originalEmployeeCode = String(
      formData.get("original_employee_code") ?? ""
    ).trim();

    const baseUrl = `/employees/code/${encodeURIComponent(
      originalEmployeeCode
    )}/edit`;

    const { data: beforeEmployee, error: beforeEmployeeError } = await admin
      .from("employees")
      .select(
        "id, employee_code, name, email, app_role, status, employment_type, hire_date"
      )
      .eq("id", targetEmployeeId)
      .maybeSingle();

    if (beforeEmployeeError) {
      redirect(`${baseUrl}?error=${encodeURIComponent(beforeEmployeeError.message)}`);
    }

    if (!beforeEmployee) {
      redirect(`/employees?error=${encodeURIComponent("社員情報が見つかりません")}`);
    }

    const canEdit =
      me.role === "admin" ||
      me.role === "hr" ||
      me.employeeId === beforeEmployee.id;

    if (!canEdit) redirect("/unauthorized");

    const canEditRole = me.role === "admin" || me.role === "hr";

    const { data: beforeProfile } = await admin
      .from("employee_profiles")
      .select(
        "phone_number, current_address, emergency_contact_name, emergency_contact_phone, profile_memo"
      )
      .eq("employee_id", beforeEmployee.id)
      .maybeSingle();

    const { data: beforeCareer } = await admin
      .from("employee_career_goals")
      .select("desired_role, career_goal, skill_notes")
      .eq("employee_id", beforeEmployee.id)
      .maybeSingle();

    const nextEmployeeCode = String(
      formData.get("employee_code") ?? beforeEmployee.employee_code
    ).trim();

    const nextName = String(formData.get("name") ?? "").trim();
    const nextEmail = String(formData.get("email") ?? "").trim();

    if (!nextEmployeeCode) {
      redirect(`${baseUrl}?error=${encodeURIComponent("社員番号を入力してください")}`);
    }

    if (!nextName) {
      redirect(`${baseUrl}?error=${encodeURIComponent("氏名を入力してください")}`);
    }

    const employeePayload = {
      employee_code: nextEmployeeCode,
      name: nextName,
      email: nextEmail || null,

      app_role: canEditRole
        ? String(formData.get("app_role") ?? beforeEmployee.app_role)
        : beforeEmployee.app_role,
      status: canEditRole
        ? String(formData.get("status") ?? beforeEmployee.status)
        : beforeEmployee.status,
      employment_type: canEditRole
        ? String(formData.get("employment_type") ?? beforeEmployee.employment_type)
        : beforeEmployee.employment_type,
      hire_date: canEditRole
        ? normalizeDate(String(formData.get("hire_date") ?? ""))
        : beforeEmployee.hire_date,
    };

    const profilePayload = {
      employee_id: beforeEmployee.id,
      phone_number: normalizeText(formData.get("phone_number")),
      current_address: normalizeText(formData.get("current_address")),
      emergency_contact_name: normalizeText(
        formData.get("emergency_contact_name")
      ),
      emergency_contact_phone: normalizeText(
        formData.get("emergency_contact_phone")
      ),
      profile_memo: normalizeText(formData.get("profile_memo")),
    };

    const careerPayload = {
      employee_id: beforeEmployee.id,
      desired_role: normalizeText(formData.get("desired_role")),
      career_goal: normalizeText(formData.get("career_goal")),
      skill_notes: normalizeText(formData.get("skill_notes")),
    };

    const { error: empUpdateError } = await admin
      .from("employees")
      .update(employeePayload)
      .eq("id", beforeEmployee.id);

    if (empUpdateError) {
      redirect(`${baseUrl}?error=${encodeURIComponent(empUpdateError.message)}`);
    }

    const { error: profileError } = await admin
      .from("employee_profiles")
      .upsert(profilePayload, { onConflict: "employee_id" });

    if (profileError) {
      redirect(`${baseUrl}?error=${encodeURIComponent(profileError.message)}`);
    }

    const { error: careerError } = await admin
      .from("employee_career_goals")
      .upsert(careerPayload, { onConflict: "employee_id" });

    if (careerError) {
      redirect(`${baseUrl}?error=${encodeURIComponent(careerError.message)}`);
    }

    await createActivityLog({
      employeeId: beforeEmployee.id,
      actorEmployeeId: me.employeeId,
      activityType: "employee_updated",
      title: "社員基本情報を編集しました",
      description: "社員番号、氏名、メール、プロフィール、キャリア情報などを更新しました。",
      relatedType: "employee",
      relatedId: beforeEmployee.id,
      metadata: {
        before: {
          employee: {
            employee_code: beforeEmployee.employee_code,
            name: beforeEmployee.name,
            email: beforeEmployee.email,
            app_role: beforeEmployee.app_role,
            status: beforeEmployee.status,
            employment_type: beforeEmployee.employment_type,
            hire_date: beforeEmployee.hire_date,
          },
          profile: beforeProfile ?? null,
          career: beforeCareer ?? null,
        },
        after: {
          employee: employeePayload,
          profile: profilePayload,
          career: careerPayload,
        },
        updated_at: new Date().toISOString(),
      },
    });

    redirect(
      `/employees/code/${encodeURIComponent(
        employeePayload.employee_code
      )}?tab=timeline&updated=${encodeURIComponent(employeePayload.name)}`
    );
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <Card className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-xs font-black tracking-[0.18em] text-indigo-600">
                EMPLOYEE EDIT
              </div>
              <h1 className="mt-2 text-3xl font-black text-slate-900">
                社員情報の編集
              </h1>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                基本情報、プロフィール、キャリア希望を編集できます。保存するとタイムラインに履歴が残ります。
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Chip tone="info">{employee.employee_code}</Chip>
              <Chip>{employee.app_role}</Chip>
              <Chip>{employee.status}</Chip>
              <GhostButton href={`/employees/code/${employee.employee_code}`}>
                カルテへ戻る
              </GhostButton>
              <PrimaryButton
                href={`/employees/code/${employee.employee_code}?tab=timeline`}
              >
                タイムライン
              </PrimaryButton>
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

        {updated && (
          <Card className="border-emerald-200 bg-emerald-50 p-5">
            <div className="text-sm font-black text-emerald-700">
              社員情報を更新しました
            </div>
            <div className="mt-1 text-sm font-semibold text-emerald-600">
              更新内容をタイムラインに履歴として保存しました。
            </div>
          </Card>
        )}

        <form action={updateEmployee} className="space-y-6">
          <input type="hidden" name="employee_id" value={employee.id} />
          <input
            type="hidden"
            name="original_employee_code"
            value={employee.employee_code}
          />

          <Card className="p-6">
            <h2 className="text-xl font-black text-slate-900">基本情報</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              社員番号・氏名・メール・権限・状態を管理します。
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="社員番号">
                <input
                  name="employee_code"
                  defaultValue={employee.employee_code ?? ""}
                  required
                  className="input"
                />
              </Field>

              <Field label="氏名">
                <input
                  name="name"
                  defaultValue={employee.name ?? ""}
                  required
                  className="input"
                />
              </Field>

              <Field label="メール">
                <input
                  name="email"
                  type="email"
                  defaultValue={employee.email ?? ""}
                  className="input"
                />
              </Field>

              <Field label="入社日">
                <input
                  name="hire_date"
                  type="date"
                  defaultValue={employee.hire_date ?? ""}
                  disabled={!canEditRole}
                  className="input disabled:bg-slate-100 disabled:text-slate-500"
                />
              </Field>

              <Field label="ロール">
                <select
                  name="app_role"
                  defaultValue={employee.app_role ?? "employee"}
                  disabled={!canEditRole}
                  className="input disabled:bg-slate-100 disabled:text-slate-500"
                >
                  <option value="admin">admin</option>
                  <option value="hr">hr</option>
                  <option value="manager">manager</option>
                  <option value="mentor">mentor</option>
                  <option value="employee">employee</option>
                </select>
              </Field>

              <Field label="状態">
                <select
                  name="status"
                  defaultValue={employee.status ?? "active"}
                  disabled={!canEditRole}
                  className="input disabled:bg-slate-100 disabled:text-slate-500"
                >
                  <option value="active">active</option>
                  <option value="leave">leave</option>
                  <option value="inactive">inactive</option>
                </select>
              </Field>

              <Field label="雇用区分">
                <select
                  name="employment_type"
                  defaultValue={employee.employment_type ?? "full_time"}
                  disabled={!canEditRole}
                  className="input disabled:bg-slate-100 disabled:text-slate-500"
                >
                  <option value="full_time">full_time</option>
                  <option value="part_time">part_time</option>
                  <option value="contract">contract</option>
                  <option value="other">other</option>
                </select>
              </Field>
            </div>

            {!canEditRole && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-700">
                権限・状態・雇用区分・入社日は、管理者または人事のみ変更できます。
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-black text-slate-900">
              プロフィール情報
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              連絡先、住所、緊急連絡先などを管理します。
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="電話番号">
                <input
                  name="phone_number"
                  defaultValue={profile?.phone_number ?? ""}
                  className="input"
                />
              </Field>

              <Field label="住所">
                <input
                  name="current_address"
                  defaultValue={profile?.current_address ?? ""}
                  className="input"
                />
              </Field>

              <Field label="緊急連絡先 氏名">
                <input
                  name="emergency_contact_name"
                  defaultValue={profile?.emergency_contact_name ?? ""}
                  className="input"
                />
              </Field>

              <Field label="緊急連絡先 電話番号">
                <input
                  name="emergency_contact_phone"
                  defaultValue={profile?.emergency_contact_phone ?? ""}
                  className="input"
                />
              </Field>
            </div>

            <div className="mt-4">
              <Field label="プロフィールメモ">
                <textarea
                  name="profile_memo"
                  defaultValue={profile?.profile_memo ?? ""}
                  rows={5}
                  className="input"
                />
              </Field>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-black text-slate-900">
              キャリア情報
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              希望職種、キャリア目標、スキル・育成メモを管理します。
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="希望する役割・職種">
                <input
                  name="desired_role"
                  defaultValue={career?.desired_role ?? ""}
                  className="input"
                />
              </Field>

              <Field label="キャリア目標">
                <input
                  name="career_goal"
                  defaultValue={career?.career_goal ?? ""}
                  className="input"
                />
              </Field>
            </div>

            <div className="mt-4">
              <Field label="スキル・育成メモ">
                <textarea
                  name="skill_notes"
                  defaultValue={career?.skill_notes ?? ""}
                  rows={5}
                  className="input"
                />
              </Field>
            </div>
          </Card>

          <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
            <div className="text-xs font-semibold text-slate-400">
              保存すると、変更内容がタイムラインに記録されます。
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Link
                href={`/employees/code/${employee.employee_code}`}
                className={buttonClassName(
                  "inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-black text-slate-700 hover:bg-slate-50"
                )}
              >
                キャンセル
              </Link>

              <SubmitButton
                pendingText="保存中..."
                className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-6 text-sm font-black text-white hover:bg-slate-800"
              >
                保存する
              </SubmitButton>
            </div>
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

function normalizeText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function normalizeDate(value: string) {
  const text = String(value ?? "").trim();
  return text || null;
}