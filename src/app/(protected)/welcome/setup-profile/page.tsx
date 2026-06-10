import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PageShell } from "@/components/ui/page-shell";
import { Card, Chip } from "@/components/ui/ux";

export const runtime = "nodejs";

export default async function SetupProfilePage() {
  const me = await requireAuth();
  const admin = createSupabaseAdminClient();

  const { data: employee } = await admin
    .from("employees")
    .select("id, employee_code, name, email, app_role, initial_profile_completed_at")
    .eq("id", me.employeeId)
    .maybeSingle();

  if (!employee) redirect("/unauthorized");

  if (employee.initial_profile_completed_at) {
    redirect("/dashboard");
  }

  const { data: profile } = await admin
    .from("employee_profiles")
    .select(
      "phone_number, current_address, emergency_contact_name, emergency_contact_phone, profile_memo"
    )
    .eq("employee_id", me.employeeId)
    .maybeSingle();

  const { data: career } = await admin
    .from("employee_career_goals")
    .select("desired_role, career_goal, skill_notes")
    .eq("employee_id", me.employeeId)
    .maybeSingle();

  async function completeSetup(formData: FormData) {
    "use server";

    const me = await requireAuth();
    const admin = createSupabaseAdminClient();

    const phoneNumber = String(formData.get("phone_number") ?? "").trim();
    const currentAddress = String(formData.get("current_address") ?? "").trim();
    const emergencyContactName = String(
      formData.get("emergency_contact_name") ?? ""
    ).trim();
    const emergencyContactPhone = String(
      formData.get("emergency_contact_phone") ?? ""
    ).trim();
    const profileMemo = String(formData.get("profile_memo") ?? "").trim();

    const desiredRole = String(formData.get("desired_role") ?? "").trim();
    const careerGoal = String(formData.get("career_goal") ?? "").trim();
    const skillNotes = String(formData.get("skill_notes") ?? "").trim();

    await admin.from("employee_profiles").upsert(
      {
        employee_id: me.employeeId,
        phone_number: phoneNumber,
        current_address: currentAddress,
        emergency_contact_name: emergencyContactName,
        emergency_contact_phone: emergencyContactPhone,
        profile_memo: profileMemo,
      },
      { onConflict: "employee_id" }
    );

    await admin.from("employee_career_goals").upsert(
      {
        employee_id: me.employeeId,
        desired_role: desiredRole,
        career_goal: careerGoal,
        skill_notes: skillNotes,
      },
      { onConflict: "employee_id" }
    );

    await admin
      .from("employees")
      .update({
        initial_profile_completed_at: new Date().toISOString(),
      })
      .eq("id", me.employeeId);

    redirect("/dashboard");
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-xs font-black tracking-[0.18em] text-indigo-600">
                WELCOME
              </div>
              <h1 className="mt-2 text-3xl font-black text-slate-900">
                初回プロフィール入力
              </h1>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                初回ログインありがとうございます。業務で使用する基本情報とキャリア希望を入力してください。
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Chip tone="info">{employee.employee_code}</Chip>
              <Chip>{employee.app_role}</Chip>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
            <div className="text-sm font-black text-slate-900">
              {employee.name}
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-500">
              {employee.email}
            </div>
          </div>
        </Card>

        <form action={completeSetup} className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-black text-slate-900">基本情報</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              連絡先や緊急連絡先を入力してください。
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-black text-slate-700">
                  電話番号
                </label>
                <input
                  name="phone_number"
                  defaultValue={profile?.phone_number ?? ""}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  placeholder="例：090-0000-0000"
                />
              </div>

              <div>
                <label className="text-sm font-black text-slate-700">
                  現住所
                </label>
                <input
                  name="current_address"
                  defaultValue={profile?.current_address ?? ""}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  placeholder="例：新潟県〇〇市..."
                />
              </div>

              <div>
                <label className="text-sm font-black text-slate-700">
                  緊急連絡先 氏名
                </label>
                <input
                  name="emergency_contact_name"
                  defaultValue={profile?.emergency_contact_name ?? ""}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  placeholder="例：山田 太郎"
                />
              </div>

              <div>
                <label className="text-sm font-black text-slate-700">
                  緊急連絡先 電話番号
                </label>
                <input
                  name="emergency_contact_phone"
                  defaultValue={profile?.emergency_contact_phone ?? ""}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  placeholder="例：025-000-0000"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-black text-slate-700">
                  補足メモ
                </label>
                <textarea
                  name="profile_memo"
                  defaultValue={profile?.profile_memo ?? ""}
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  placeholder="勤務上の配慮事項、連絡の希望など"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-black text-slate-900">キャリア希望</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              今後の希望や身につけたいスキルを入力してください。
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-black text-slate-700">
                  希望する役割・職種
                </label>
                <input
                  name="desired_role"
                  defaultValue={career?.desired_role ?? ""}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  placeholder="例：営業、管理、システム、採用など"
                />
              </div>

              <div>
                <label className="text-sm font-black text-slate-700">
                  キャリア目標
                </label>
                <textarea
                  name="career_goal"
                  defaultValue={career?.career_goal ?? ""}
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  placeholder="例：今後挑戦したい業務、目指したい役職など"
                />
              </div>

              <div>
                <label className="text-sm font-black text-slate-700">
                  スキル・資格・学びたいこと
                </label>
                <textarea
                  name="skill_notes"
                  defaultValue={career?.skill_notes ?? ""}
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  placeholder="例：Excel、営業スキル、マネジメント、衛生管理者など"
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              className="inline-flex h-11 items-center rounded-xl bg-slate-900 px-6 text-sm font-black text-white hover:bg-slate-800"
            >
              入力を完了する
            </button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}