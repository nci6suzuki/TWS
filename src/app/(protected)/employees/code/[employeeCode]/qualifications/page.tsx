// src/app/(protected)/employees/code/[employeeCode]/qualifications/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createActivityLog } from "@/lib/activity-logs/create-activity-log";
import { PageShell } from "@/components/ui/page-shell";
import { Hero, Card, Chip, PrimaryButton, GhostButton } from "@/components/ui/ux";
import { DeleteQualificationButton } from "@/components/employees/delete-qualification-button";
import { buttonClassName } from "@/lib/ui/button-class";

export const runtime = "nodejs";

export default async function EmployeeQualificationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ employeeCode: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const me = await requireAuth();

  if (me.role !== "admin" && me.role !== "hr") {
    redirect("/unauthorized");
  }

  const { employeeCode } = await params;
  const sp = await searchParams;

  const code = decodeURIComponent(employeeCode).trim();

  const getParam = (key: string) => {
    const v = sp[key];
    return Array.isArray(v) ? v[0] ?? "" : v ?? "";
  };

  const errorMessage = getParam("error");
  const created = getParam("created");

  const admin = createSupabaseAdminClient();

  const { data: employee, error: employeeError } = await admin
    .from("employees")
    .select("id, employee_code, name, email, app_role, status")
    .eq("employee_code", code)
    .maybeSingle();

  if (employeeError) throw employeeError;
  if (!employee) redirect("/employees");

  const { data: qualifications, error: qualificationsError } = await admin
    .from("employee_qualifications")
    .select("id, qualification_name, acquired_on, expires_on, status, memo, created_at")
    .eq("employee_id", employee.id)
    .order("expires_on", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (qualificationsError) throw qualificationsError;

  async function createQualification(formData: FormData) {
    "use server";

    const me = await requireAuth();

    if (me.role !== "admin" && me.role !== "hr") {
      redirect("/unauthorized");
    }

    const admin = createSupabaseAdminClient();

    const employeeId = String(formData.get("employee_id") ?? "");
    const employeeCode = String(formData.get("employee_code") ?? "");
    const qualificationName = String(formData.get("qualification_name") ?? "").trim();
    const acquiredOn = String(formData.get("acquired_on") ?? "").trim();
    const expiresOn = String(formData.get("expires_on") ?? "").trim();
    const status = String(formData.get("status") ?? "active").trim();
    const memo = String(formData.get("memo") ?? "").trim();

    const baseUrl = `/employees/code/${encodeURIComponent(
      employeeCode
    )}/qualifications`;

    if (!employeeId || !employeeCode) {
      redirect(
        `${baseUrl}?error=${encodeURIComponent("対象社員が確認できません")}`
      );
    }

    if (!qualificationName) {
      redirect(
        `${baseUrl}?error=${encodeURIComponent("資格名を入力してください")}`
      );
    }

    const { data: inserted, error } = await admin
      .from("employee_qualifications")
      .insert({
        employee_id: employeeId,
        qualification_name: qualificationName,
        acquired_on: acquiredOn || null,
        expires_on: expiresOn || null,
        status: status || "active",
        memo: memo || null,
      })
      .select("id, employee_id, qualification_name, acquired_on, expires_on, status, memo")
      .single();

    if (error) {
      redirect(`${baseUrl}?error=${encodeURIComponent(error.message)}`);
    }

    await createActivityLog({
      employeeId,
      actorEmployeeId: me.employeeId,
      activityType: "qualification_created",
      title: "資格を追加しました",
      description: `「${qualificationName}」を追加しました。${
        expiresOn ? `有効期限：${expiresOn}` : "有効期限：未設定"
      }`,
      relatedType: "employee_qualification",
      relatedId: inserted.id,
      metadata: {
        qualification_name: qualificationName,
        acquired_on: acquiredOn || null,
        expires_on: expiresOn || null,
        status: status || "active",
        memo: memo || null,
      },
    });

    redirect(
      `${baseUrl}?created=${encodeURIComponent(qualificationName)}`
    );
  }

  return (
    <PageShell>
      <div className="space-y-6">
        <Hero
          title="資格管理"
          subtitle="社員の保有資格、取得日、有効期限を管理します。追加した内容はタイムラインにも履歴として残ります。"
          meta={
            <div className="flex flex-wrap gap-2">
              <Chip tone="info">Qualifications</Chip>
              <Chip>
                {employee.employee_code} / {employee.name}
              </Chip>
              <Chip>登録数: {(qualifications ?? []).length}</Chip>
            </div>
          }
          right={
            <>
              <GhostButton href={`/employees/code/${employee.employee_code}`}>
                カルテへ戻る
              </GhostButton>
              <PrimaryButton
                href={`/employees/code/${employee.employee_code}?tab=qualifications`}
              >
                資格タブへ
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

        {created && (
          <Card className="border-emerald-200 bg-emerald-50 p-5">
            <div className="text-sm font-black text-emerald-700">
              資格を追加しました
            </div>
            <div className="mt-1 text-sm font-semibold text-emerald-600">
              「{created}」を追加し、タイムラインに履歴を保存しました。
            </div>
          </Card>
        )}

        <Card className="p-5">
          <div className="mb-5">
            <h2 className="text-lg font-black text-slate-900">資格を追加</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              有効期限を入れておくと、期限切れ・30日以内の要対応として検知できます。
            </p>
          </div>

          <form action={createQualification} className="space-y-5">
            <input type="hidden" name="employee_id" value={employee.id} />
            <input
              type="hidden"
              name="employee_code"
              value={employee.employee_code}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <div className="mb-1 text-sm font-black text-slate-700">
                  資格名 <span className="text-rose-500">*</span>
                </div>
                <input
                  className="input"
                  name="qualification_name"
                  placeholder="例：第一種衛生管理者"
                  required
                />
              </label>

              <label className="block">
                <div className="mb-1 text-sm font-black text-slate-700">
                  状態
                </div>
                <select className="input" name="status" defaultValue="active">
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
                <input className="input" type="date" name="acquired_on" />
              </label>

              <label className="block">
                <div className="mb-1 text-sm font-black text-slate-700">
                  有効期限
                </div>
                <input className="input" type="date" name="expires_on" />
              </label>
            </div>

            <label className="block">
              <div className="mb-1 text-sm font-black text-slate-700">
                メモ
              </div>
              <textarea
                className="input min-h-28"
                name="memo"
                placeholder="更新予定、証明書の保管場所、補足など"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className={buttonClassName("inline-flex h-11 items-center rounded-xl bg-slate-900 px-5 text-sm font-black text-white hover:bg-slate-800")}
              >
                資格を追加
              </button>

              <Link
                href={`/employees/code/${employee.employee_code}?tab=qualifications`}
                className={buttonClassName("inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 hover:bg-slate-50")}
              >
                戻る
              </Link>
            </div>
          </form>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-black text-slate-900">登録済み資格</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              編集・削除した場合も、次の工程でタイムラインに履歴を残すようにします。
            </p>
          </div>

          <div className="overflow-auto">
            <table className="min-w-[1000px] w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="px-4 py-3 text-left font-black">資格名</th>
                  <th className="px-4 py-3 text-left font-black">取得日</th>
                  <th className="px-4 py-3 text-left font-black">有効期限</th>
                  <th className="px-4 py-3 text-left font-black">状態</th>
                  <th className="px-4 py-3 text-left font-black">メモ</th>
                  <th className="px-4 py-3 text-left font-black">操作</th>
                </tr>
              </thead>

              <tbody>
                {(qualifications ?? []).length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-sm font-bold text-slate-500"
                    >
                      登録済み資格はありません
                    </td>
                  </tr>
                ) : (
                  (qualifications ?? []).map((q: any) => {
                    const isExpired =
                      q.expires_on && q.expires_on < formatDate(new Date());

                    return (
                      <tr
                        key={q.id}
                        className="border-b border-slate-100 bg-white hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 font-black text-slate-900">
                          {q.qualification_name}
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          {q.acquired_on || "-"}
                        </td>

                        <td className="px-4 py-3">
                          {q.expires_on ? (
                            <Chip tone={isExpired ? "danger" : "info"}>
                              {q.expires_on}
                            </Chip>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <Chip tone={q.status === "active" ? "ok" : "gray"}>
                            {getQualificationStatusLabel(q.status)}
                          </Chip>
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          {q.memo || "-"}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/employees/code/${employee.employee_code}/qualifications/${q.id}/edit`}
                              className={buttonClassName("inline-flex h-8 items-center rounded-lg bg-slate-900 px-3 text-xs font-black text-white hover:bg-slate-800")}
                            >
                              編集
                            </Link>

                            <DeleteQualificationButton
                              qualificationId={q.id}
                              employeeCode={employee.employee_code}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getQualificationStatusLabel(status: string) {
  if (status === "active") return "有効";
  if (status === "expired") return "期限切れ";
  if (status === "planned") return "取得予定";
  if (status === "inactive") return "無効";
  return status || "-";
}