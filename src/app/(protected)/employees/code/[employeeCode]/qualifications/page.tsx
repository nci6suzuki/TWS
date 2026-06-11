import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PageShell } from "@/components/ui/page-shell";
import { Card, Chip } from "@/components/ui/ux";
import { DeleteQualificationButton } from "@/components/employees/delete-qualification-button";

export const runtime = "nodejs";

export default async function EmployeeQualificationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ employeeCode: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const me = await requireAuth();
  const { employeeCode } = await params;
  const sp = await searchParams;

  const errorParam = sp.error;
  const errorMessage = Array.isArray(errorParam)
    ? errorParam[0] ?? ""
    : errorParam ?? "";

  const admin = createSupabaseAdminClient();

  const { data: employee, error: employeeError } = await admin
    .from("employees")
    .select("id, employee_code, name, email, app_role, status")
    .eq("employee_code", employeeCode)
    .maybeSingle();

  if (employeeError) throw employeeError;
  if (!employee) notFound();

  const canManage = me.role === "admin" || me.role === "hr";

  if (!canManage && me.employeeId !== employee.id) {
    redirect("/unauthorized");
  }

  const { data: qualifications, error: qError } = await admin
    .from("employee_qualifications")
    .select(
      "id, qualification_name, acquired_on, expires_on, status, memo, created_at"
    )
    .eq("employee_id", employee.id)
    .order("expires_on", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (qError) throw qError;

async function addQualification(formData: FormData) {
  "use server";

  const me = await requireAuth();
  if (me.role !== "admin" && me.role !== "hr") redirect("/unauthorized");

  const admin = createSupabaseAdminClient();

  const targetEmployeeId = String(formData.get("employee_id") ?? "").trim();
  const targetEmployeeCode = String(
    formData.get("employee_code") ?? ""
  ).trim();

  const qualificationName = String(
    formData.get("qualification_name") ?? ""
  ).trim();

  const acquiredOnRaw = String(formData.get("acquired_on") ?? "").trim();
  const expiresOnRaw = String(formData.get("expires_on") ?? "").trim();
  const memo = String(formData.get("memo") ?? "").trim();

  const acquiredOn = acquiredOnRaw === "" ? null : acquiredOnRaw;
  const expiresOn = expiresOnRaw === "" ? null : expiresOnRaw;

  if (!targetEmployeeId || !targetEmployeeCode) {
    redirect(
      `/employees/code/${targetEmployeeCode || employeeCode}/qualifications?error=${encodeURIComponent(
        "社員情報を取得できませんでした"
      )}`
    );
  }

  if (!qualificationName) {
    redirect(
      `/employees/code/${targetEmployeeCode}/qualifications?error=${encodeURIComponent(
        "資格名を入力してください"
      )}`
    );
  }

  const { data: target, error: targetError } = await admin
    .from("employees")
    .select("id, employee_code")
    .eq("id", targetEmployeeId)
    .maybeSingle();

  if (targetError || !target) {
    redirect(
      `/employees/code/${targetEmployeeCode}/qualifications?error=${encodeURIComponent(
        targetError?.message ?? "対象社員が見つかりません"
      )}`
    );
  }

  const { error } = await admin.from("employee_qualifications").insert({
    employee_id: targetEmployeeId,
    qualification_name: qualificationName,
    acquired_on: acquiredOn,
    expires_on: expiresOn,
    status: "active",
    memo,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    redirect(
      `/employees/code/${targetEmployeeCode}/qualifications?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  redirect(`/employees/code/${targetEmployeeCode}/qualifications`);
}

  async function deleteQualification(formData: FormData) {
    "use server";

    const me = await requireAuth();
    if (me.role !== "admin" && me.role !== "hr") redirect("/unauthorized");

    const admin = createSupabaseAdminClient();

    const qualificationId = String(
      formData.get("qualification_id") ?? ""
    ).trim();
    const targetEmployeeCode = String(
      formData.get("employee_code") ?? ""
    ).trim();

    if (!qualificationId) {
      redirect(`/employees/code/${targetEmployeeCode}/qualifications`);
    }

    const { error } = await admin
      .from("employee_qualifications")
      .delete()
      .eq("id", qualificationId);

    if (error) {
      redirect(
        `/employees/code/${targetEmployeeCode}/qualifications?error=${encodeURIComponent(
          error.message
        )}`
      );
    }

    redirect(`/employees/code/${targetEmployeeCode}/qualifications`);
  }

  const today = new Date().toISOString().slice(0, 10);
  const alertDateObj = new Date();
  alertDateObj.setDate(alertDateObj.getDate() + 30);
  const alertDate = alertDateObj.toISOString().slice(0, 10);

  const activeCount = (qualifications ?? []).filter(
    (q) => q.status === "active"
  ).length;

  const expiredCount = (qualifications ?? []).filter(
    (q) => q.expires_on && q.expires_on < today
  ).length;
  
  const expiringSoonCount = (qualifications ?? []).filter(
    (q) =>
        q.expires_on &&
        q.expires_on >= today &&
        q.expires_on <= alertDate
  ).length;

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <Card className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-xs font-black tracking-[0.18em] text-indigo-600">
                QUALIFICATIONS
              </div>
              <h1 className="mt-2 text-3xl font-black text-slate-900">
                資格管理
              </h1>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                社員の保有資格、取得日、有効期限を管理します。
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Chip tone="info">{employee.employee_code}</Chip>
              <Chip>{employee.name}</Chip>
              <Link
                href={`/employees/code/${employee.employee_code}`}
                className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
              >
                カルテへ戻る
              </Link>
            </div>
          </div>
        </Card>

<div className="grid grid-cols-1 gap-3 md:grid-cols-4">
  <Card className="p-5">
    <div className="text-xs font-black tracking-[0.12em] text-slate-500">
      登録資格数
    </div>
    <div className="mt-2 text-3xl font-black text-slate-900">
      {qualifications?.length ?? 0}
    </div>
  </Card>

  <Card className="p-5">
    <div className="text-xs font-black tracking-[0.12em] text-slate-500">
      有効
    </div>
    <div className="mt-2 text-3xl font-black text-emerald-600">
      {activeCount}
    </div>
  </Card>

  <Card className="p-5">
    <div className="text-xs font-black tracking-[0.12em] text-slate-500">
      30日以内
    </div>
    <div className="mt-2 text-3xl font-black text-amber-600">
      {expiringSoonCount}
    </div>
  </Card>

  <Card className="p-5">
    <div className="text-xs font-black tracking-[0.12em] text-slate-500">
      期限切れ
    </div>
    <div className="mt-2 text-3xl font-black text-rose-600">
      {expiredCount}
    </div>
  </Card>
</div>

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

        {canManage && (
          <Card className="p-6">
            <h2 className="text-xl font-black text-slate-900">資格を追加</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              資格名、取得日、有効期限を登録します。
            </p>

            <form action={addQualification} className="mt-5 space-y-4">
              <input type="hidden" name="employee_id" value={employee.id} />
              <input
                type="hidden"
                name="employee_code"
                value={employee.employee_code}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Field label="資格名">
                  <input
                    name="qualification_name"
                    required
                    className="input"
                    placeholder="例：第一種衛生管理者"
                  />
                </Field>

                <Field label="取得日">
                  <input name="acquired_on" type="date" className="input" />
                </Field>

                <Field label="有効期限">
                  <input name="expires_on" type="date" className="input" />
                </Field>
              </div>

              <Field label="メモ">
                <textarea
                  name="memo"
                  rows={3}
                  className="input"
                  placeholder="更新予定、証明書の保管場所など"
                />
              </Field>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-5 text-sm font-black text-white hover:bg-slate-800"
                >
                  資格を追加
                </button>
              </div>
            </form>
          </Card>
        )}

        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-black text-slate-900">資格一覧</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              有効期限が過ぎている資格は期限切れとして表示します。
            </p>
          </div>

          <div className="overflow-auto">
            <table className="min-w-[950px] w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-3 text-left font-black">資格名</th>
                  <th className="px-5 py-3 text-left font-black">取得日</th>
                  <th className="px-5 py-3 text-left font-black">有効期限</th>
                  <th className="px-5 py-3 text-left font-black">状態</th>
                  <th className="px-5 py-3 text-left font-black">メモ</th>
                  {canManage && (
                    <th className="px-5 py-3 text-left font-black">操作</th>
                  )}
                </tr>
              </thead>

              <tbody>
                {(qualifications ?? []).map((q) => {
                  const isExpired = q.expires_on && q.expires_on < today;
                  const isExpiringSoon =
                  q.expires_on && q.expires_on >= today && q.expires_on <= alertDate;

                  return (
                    <tr
                      key={q.id}
                      className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 font-black text-slate-900">
                        {q.qualification_name}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {q.acquired_on ?? "-"}
                      </td>

                      <td className="px-5 py-4">
                        {q.expires_on ? (
                            <div
                            className={[
                                "font-semibold",
                                isExpired
                                ? "text-rose-600"
                                : isExpiringSoon
                                ? "text-amber-600"
                                : "text-slate-600",
                            ].join(" ")}
                            >
                            {q.expires_on}
                            </div>
                            ) : (
                            <span className="text-slate-400">-</span>
                            )}
                    </td>

                      <td className="px-5 py-4">
                        {isExpired ? (
                            <Chip tone="danger">期限切れ</Chip>
                        ) : isExpiringSoon ? (
                        <span className="inline-flex items-center rounded-xl border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                            30日以内
                        </span>
                        ) : (
                        <Chip tone="ok">有効</Chip>
                        )}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {q.memo || "-"}
                      </td>

                      {canManage && (
<td className="px-5 py-4">
  <div className="flex flex-wrap gap-2">
    <Link
      href={`/employees/code/${employee.employee_code}/qualifications/${q.id}/edit`}
      className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:bg-slate-50"
    >
      編集
    </Link>

<DeleteQualificationButton
  employeeCode={employee.employee_code}
  qualificationId={q.id}
  returnTo={`/employees/code/${employee.employee_code}/qualifications`}
/>
  </div>
</td>
                      )}
                    </tr>
                  );
                })}

                {(qualifications ?? []).length === 0 && (
                  <tr>
                    <td
                      colSpan={canManage ? 6 : 5}
                      className="px-5 py-10 text-center"
                    >
                      <div className="text-sm font-bold text-slate-500">
                        登録されている資格はありません
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
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