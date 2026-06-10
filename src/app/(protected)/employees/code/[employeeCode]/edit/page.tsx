import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PageShell } from "@/components/ui/page-shell";
import { Card, Chip } from "@/components/ui/ux";

export const runtime = "nodejs";

export default async function EmployeeEditPage({
  params,
}: {
  params: Promise<{ employeeCode: string }>;
}) {
  const me = await requireAuth();
  const { employeeCode } = await params;

  const admin = createSupabaseAdminClient();

  const { data: employee, error: employeeError } = await admin
    .from("employees")
    .select(
      "id, employee_code, name, email, app_role, status, employment_type"
    )
    .eq("employee_code", employeeCode)
    .maybeSingle();

  if (employeeError) throw employeeError;
  if (!employee) notFound();

  const canEdit =
    me.role === "admin" ||
    me.role === "hr" ||
    me.employeeId === employee.id;

  if (!canEdit) redirect("/unauthorized");

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

    const { data: target, error: targetError } = await admin
      .from("employees")
      .select("id, employee_code")
      .eq("id", targetEmployeeId)
      .maybeSingle();

    if (targetError) throw targetError;
    if (!target) redirect("/employees");

    const canEdit =
      me.role === "admin" ||
      me.role === "hr" ||
      me.employeeId === target.id;

    if (!canEdit) redirect("/unauthorized");

    const employeePayload = {
      employee_code: String(formData.get("employee_code") ?? "").trim(),
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      app_role: String(formData.get("app_role") ?? "employee"),
      status: String(formData.get("status") ?? "active"),
      employment_type: String(formData.get("employment_type") ?? "full_time"),
    };

    const profilePayload = {
      employee_id: target.id,
      phone_number: String(formData.get("phone_number") ?? "").trim(),
      current_address: String(formData.get("current_address") ?? "").trim(),
      emergency_contact_name: String(
        formData.get("emergency_contact_name") ?? ""
      ).trim(),
      emergency_contact_phone: String(
        formData.get("emergency_contact_phone") ?? ""
      ).trim(),
      profile_memo: String(formData.get("profile_memo") ?? "").trim(),
    };

    const careerPayload = {
      employee_id: target.id,
      desired_role: String(formData.get("desired_role") ?? "").trim(),
      career_goal: String(formData.get("career_goal") ?? "").trim(),
      skill_notes: String(formData.get("skill_notes") ?? "").trim(),
    };

    const { error: empUpdateError } = await admin
      .from("employees")
      .update(employeePayload)
      .eq("id", target.id);

    if (empUpdateError) {
      redirect(
        `/employees/code/${originalEmployeeCode}/edit?error=${encodeURIComponent(
          empUpdateError.message
        )}`
      );
    }

    const { error: profileError } = await admin
      .from("employee_profiles")
      .upsert(profilePayload, { onConflict: "employee_id" });

    if (profileError) {
      redirect(
        `/employees/code/${originalEmployeeCode}/edit?error=${encodeURIComponent(
          profileError.message
        )}`
      );
    }

    const { error: careerError } = await admin
      .from("employee_career_goals")
      .upsert(careerPayload, { onConflict: "employee_id" });

    if (careerError) {
      redirect(
        `/employees/code/${originalEmployeeCode}/edit?error=${encodeURIComponent(
          careerError.message
        )}`
      );
    }

    redirect(`/employees/code/${employeePayload.employee_code}`);
  }

  const canEditRole = me.role === "admin" || me.role === "hr";

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
                基本情報、プロフィール、キャリア希望を編集できます。
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Chip tone="info">{employee.employee_code}</Chip>
              <Chip>{employee.app_role}</Chip>
              <Link
                href={`/employees/code/${employee.employee_code}`}
                className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
              >
                カルテへ戻る
              </Link>
            </div>
          </div>
        </Card>

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
                  <option value="inactive">inactive</option>
                  <option value="on_leave">on_leave</option>
                  <option value="retired">retired</option>
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
                  <option value="temporary">temporary</option>
                  <option value="outsourced">outsourced</option>
                </select>
              </Field>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-black text-slate-900">
              プロフィール
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              連絡先や緊急連絡先を編集します。
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="電話番号">
                <input
                  name="phone_number"
                  defaultValue={profile?.phone_number ?? ""}
                  className="input"
                  placeholder="例：090-0000-0000"
                />
              </Field>

              <Field label="現住所">
                <input
                  name="current_address"
                  defaultValue={profile?.current_address ?? ""}
                  className="input"
                  placeholder="例：新潟県〇〇市..."
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

              <div className="md:col-span-2">
                <Field label="補足メモ">
                  <textarea
                    name="profile_memo"
                    defaultValue={profile?.profile_memo ?? ""}
                    rows={3}
                    className="input"
                  />
                </Field>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-black text-slate-900">
              キャリア希望
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              今後の希望や身につけたいスキルを編集します。
            </p>

            <div className="mt-5 space-y-4">
              <Field label="希望する役割・職種">
                <input
                  name="desired_role"
                  defaultValue={career?.desired_role ?? ""}
                  className="input"
                  placeholder="例：営業、管理、システム、採用など"
                />
              </Field>

              <Field label="キャリア目標">
                <textarea
                  name="career_goal"
                  defaultValue={career?.career_goal ?? ""}
                  rows={4}
                  className="input"
                />
              </Field>

              <Field label="スキル・資格・学びたいこと">
                <textarea
                  name="skill_notes"
                  defaultValue={career?.skill_notes ?? ""}
                  rows={4}
                  className="input"
                />
              </Field>
            </div>
          </Card>

          <div className="flex flex-col gap-3 md:flex-row md:justify-end">
            <Link
              href={`/employees/code/${employee.employee_code}`}
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