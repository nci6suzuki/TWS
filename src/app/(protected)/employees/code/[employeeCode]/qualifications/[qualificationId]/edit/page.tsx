// src/app/(protected)/employees/code/[employeeCode]/qualifications/[qualificationId]/edit/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createActivityLog } from "@/lib/activity-logs/create-activity-log";
import { PageShell } from "@/components/ui/page-shell";
import {
  Hero,
  Card,
  Chip,
  PrimaryButton,
  GhostButton,
} from "@/components/ui/ux";
import { buttonClassName } from "@/lib/ui/button-class";
import { SubmitButton } from "@/components/ui/submit-button";

export const runtime = "nodejs";

export default async function QualificationEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ employeeCode: string; qualificationId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const me = await requireAuth();

  if (me.role !== "admin" && me.role !== "hr") {
    redirect("/unauthorized");
  }

  const { employeeCode, qualificationId } = await params;
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
    .select("id, employee_code, name, email, app_role, status")
    .eq("employee_code", code)
    .maybeSingle();

  if (employeeError) throw employeeError;
  if (!employee) redirect("/employees");

  const { data: qualification, error: qualificationError } = await admin
    .from("employee_qualifications")
    .select(
      "id, employee_id, qualification_name, acquired_on, expires_on, status, memo"
    )
    .eq("id", qualificationId)
    .eq("employee_id", employee.id)
    .maybeSingle();

  if (qualificationError) throw qualificationError;

  if (!qualification) {
    redirect(
      `/employees/code/${encodeURIComponent(
        employee.employee_code
      )}/qualifications?error=${encodeURIComponent("資格情報が見つかりません")}`
    );
  }

  async function updateQualification(formData: FormData) {
    "use server";

    const me = await requireAuth();

    if (me.role !== "admin" && me.role !== "hr") {
      redirect("/unauthorized");
    }

    const admin = createSupabaseAdminClient();

    const employeeId = String(formData.get("employee_id") ?? "").trim();
    const employeeCode = String(formData.get("employee_code") ?? "").trim();
    const qualificationId = String(
      formData.get("qualification_id") ?? ""
    ).trim();

    const qualificationName = String(
      formData.get("qualification_name") ?? ""
    ).trim();
    const acquiredOn = String(formData.get("acquired_on") ?? "").trim();
    const expiresOn = String(formData.get("expires_on") ?? "").trim();
    const status = String(formData.get("status") ?? "active").trim();
    const memo = String(formData.get("memo") ?? "").trim();

    const baseUrl = `/employees/code/${encodeURIComponent(
      employeeCode
    )}/qualifications/${qualificationId}/edit`;

    const listUrl = `/employees/code/${encodeURIComponent(
      employeeCode
    )}/qualifications`;

    if (!employeeId || !employeeCode || !qualificationId) {
      redirect(
        `${listUrl}?error=${encodeURIComponent("更新対象が確認できません")}`
      );
    }

    if (!qualificationName) {
      redirect(
        `${baseUrl}?error=${encodeURIComponent("資格名を入力してください")}`
      );
    }

    const { data: beforeQualification, error: beforeError } = await admin
      .from("employee_qualifications")
      .select(
        "id, employee_id, qualification_name, acquired_on, expires_on, status, memo"
      )
      .eq("id", qualificationId)
      .eq("employee_id", employeeId)
      .maybeSingle();

    if (beforeError) {
      redirect(`${baseUrl}?error=${encodeURIComponent(beforeError.message)}`);
    }

    if (!beforeQualification) {
      redirect(
        `${listUrl}?error=${encodeURIComponent("資格情報が見つかりません")}`
      );
    }

    const { data: updatedQualification, error } = await admin
      .from("employee_qualifications")
      .update({
        qualification_name: qualificationName,
        acquired_on: acquiredOn || null,
        expires_on: expiresOn || null,
        status: status || "active",
        memo: memo || null,
      })
      .eq("id", qualificationId)
      .eq("employee_id", employeeId)
      .select(
        "id, employee_id, qualification_name, acquired_on, expires_on, status, memo"
      )
      .single();

    if (error) {
      redirect(`${baseUrl}?error=${encodeURIComponent(error.message)}`);
    }

    await createActivityLog({
      employeeId,
      actorEmployeeId: me.employeeId,
      activityType: "qualification_updated",
      title: "資格を編集しました",
      description: `「${qualificationName}」を編集しました。${
        expiresOn ? `有効期限：${expiresOn}` : "有効期限：未設定"
      }`,
      relatedType: "employee_qualification",
      relatedId: updatedQualification.id,
      metadata: {
        before: {
          qualification_name: beforeQualification.qualification_name,
          acquired_on: beforeQualification.acquired_on,
          expires_on: beforeQualification.expires_on,
          status: beforeQualification.status,
          memo: beforeQualification.memo,
        },
        after: {
          qualification_name: updatedQualification.qualification_name,
          acquired_on: updatedQualification.acquired_on,
          expires_on: updatedQualification.expires_on,
          status: updatedQualification.status,
          memo: updatedQualification.memo,
        },
      },
    });

    redirect(
      `${listUrl}?updated=${encodeURIComponent(
        updatedQualification.qualification_name
      )}`
    );
  }

  return (
    <PageShell>
      <div className="space-y-6">
        <Hero
          title="資格編集"
          subtitle="資格名、取得日、有効期限、状態、メモを編集します。編集内容はタイムラインにも履歴として残ります。"
          meta={
            <div className="flex flex-wrap gap-2">
              <Chip tone="info">Qualification Edit</Chip>
              <Chip>
                {employee.employee_code} / {employee.name}
              </Chip>
              <Chip>{qualification.qualification_name}</Chip>
            </div>
          }
          right={
            <>
              <GhostButton
                href={`/employees/code/${employee.employee_code}/qualifications`}
              >
                資格管理へ戻る
              </GhostButton>

              <PrimaryButton
                href={`/employees/code/${employee.employee_code}?tab=timeline`}
              >
                タイムライン
              </PrimaryButton>
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

        {updated && (
          <Card className="border-emerald-200 bg-emerald-50 p-5">
            <div className="text-sm font-black text-emerald-700">
              資格を編集しました
            </div>
            <div className="mt-1 text-sm font-semibold text-emerald-600">
              「{updated}」を更新し、タイムラインに履歴を保存しました。
            </div>
          </Card>
        )}

        <Card className="p-5">
          <div className="mb-5">
            <h2 className="text-lg font-black text-slate-900">編集内容</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              有効期限を更新すると、社員一覧や通知生成時の要対応判定にも反映されます。
            </p>
          </div>

          <form action={updateQualification} className="space-y-5">
            <input type="hidden" name="employee_id" value={employee.id} />
            <input
              type="hidden"
              name="employee_code"
              value={employee.employee_code}
            />
            <input
              type="hidden"
              name="qualification_id"
              value={qualification.id}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <div className="mb-1 text-sm font-black text-slate-700">
                  資格名 <span className="text-rose-500">*</span>
                </div>
                <input
                  className="input"
                  name="qualification_name"
                  defaultValue={qualification.qualification_name ?? ""}
                  placeholder="例：第一種衛生管理者"
                  required
                />
              </label>

              <label className="block">
                <div className="mb-1 text-sm font-black text-slate-700">
                  状態
                </div>
                <select
                  className="input"
                  name="status"
                  defaultValue={qualification.status ?? "active"}
                >
                  <option value="active">有効</option>
                  <option value="expired">期限切れ</option>
                  <option value="planned">取得予定</option>
                  <option value="inactive">無効</option>
                </select>
              </label>

              <label className="block">
                <div className="mb-1 text-sm font-black text-slate-700">
                  取得日
                </div>
                <input
                  className="input"
                  type="date"
                  name="acquired_on"
                  defaultValue={qualification.acquired_on ?? ""}
                />
              </label>

              <label className="block">
                <div className="mb-1 text-sm font-black text-slate-700">
                  有効期限
                </div>
                <input
                  className="input"
                  type="date"
                  name="expires_on"
                  defaultValue={qualification.expires_on ?? ""}
                />
              </label>
            </div>

            <label className="block">
              <div className="mb-1 text-sm font-black text-slate-700">
                メモ
              </div>
              <textarea
                className="input min-h-28"
                name="memo"
                defaultValue={qualification.memo ?? ""}
                placeholder="更新予定、証明書の保管場所、補足など"
              />
            </label>

            <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
              <div className="text-xs font-semibold text-slate-400">
                保存すると、資格編集の履歴がタイムラインに記録されます。
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Link
                  href={`/employees/code/${employee.employee_code}/qualifications`}
                  className={buttonClassName(
                    "inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 hover:bg-slate-50"
                  )}
                >
                  資格管理へ戻る
                </Link>

                <Link
                  href={`/employees/code/${employee.employee_code}?tab=qualifications`}
                  className={buttonClassName(
                    "inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 hover:bg-slate-50"
                  )}
                >
                  資格タブへ戻る
                </Link>

                <SubmitButton
                  pendingText="保存中..."
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-black text-white hover:bg-slate-800"
                >
                  更新する
                </SubmitButton>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </PageShell>
  );
}