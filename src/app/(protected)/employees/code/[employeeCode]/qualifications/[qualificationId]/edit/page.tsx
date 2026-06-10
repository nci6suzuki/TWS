import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PageShell } from "@/components/ui/page-shell";
import { Card, Chip } from "@/components/ui/ux";

export const runtime = "nodejs";

export default async function QualificationEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ employeeCode: string; qualificationId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const me = await requireAuth();
  const { employeeCode, qualificationId } = await params;
  const sp = await searchParams;

  const errorParam = sp.error;
  const errorMessage = Array.isArray(errorParam)
    ? errorParam[0] ?? ""
    : errorParam ?? "";

  if (me.role !== "admin" && me.role !== "hr") {
    redirect("/unauthorized");
  }

  const admin = createSupabaseAdminClient();

  const { data: employee, error: employeeError } = await admin
    .from("employees")
    .select("id, employee_code, name, email")
    .eq("employee_code", employeeCode)
    .maybeSingle();

  if (employeeError) throw employeeError;
  if (!employee) notFound();

  const { data: qualification, error: qualificationError } = await admin
    .from("employee_qualifications")
    .select("id, employee_id, qualification_name, acquired_on, expires_on, status, memo")
    .eq("id", qualificationId)
    .eq("employee_id", employee.id)
    .maybeSingle();

  if (qualificationError) throw qualificationError;
  if (!qualification) notFound();

  async function updateQualification(formData: FormData) {
    "use server";

    const me = await requireAuth();
    if (me.role !== "admin" && me.role !== "hr") {
      redirect("/unauthorized");
    }

    const admin = createSupabaseAdminClient();

    const targetEmployeeCode = String(
      formData.get("employee_code") ?? ""
    ).trim();

    const targetQualificationId = String(
      formData.get("qualification_id") ?? ""
    ).trim();

    const qualificationName = String(
      formData.get("qualification_name") ?? ""
    ).trim();

    const acquiredOnRaw = String(formData.get("acquired_on") ?? "").trim();
    const expiresOnRaw = String(formData.get("expires_on") ?? "").trim();
    const status = String(formData.get("status") ?? "active").trim();
    const memo = String(formData.get("memo") ?? "").trim();

    const acquiredOn = acquiredOnRaw === "" ? null : acquiredOnRaw;
    const expiresOn = expiresOnRaw === "" ? null : expiresOnRaw;

    if (!targetQualificationId || !qualificationName) {
      redirect(
        `/employees/code/${targetEmployeeCode}/qualifications/${targetQualificationId}/edit?error=${encodeURIComponent(
          "資格名を入力してください"
        )}`
      );
    }

    const { error } = await admin
      .from("employee_qualifications")
      .update({
        qualification_name: qualificationName,
        acquired_on: acquiredOn,
        expires_on: expiresOn,
        status,
        memo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetQualificationId);

    if (error) {
      redirect(
        `/employees/code/${targetEmployeeCode}/qualifications/${targetQualificationId}/edit?error=${encodeURIComponent(
          error.message
        )}`
      );
    }

    redirect(`/employees/code/${targetEmployeeCode}/qualifications`);
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-xs font-black tracking-[0.18em] text-indigo-600">
                QUALIFICATION EDIT
              </div>
              <h1 className="mt-2 text-3xl font-black text-slate-900">
                資格情報の編集
              </h1>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                資格名、取得日、有効期限、状態、メモを編集します。
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Chip tone="info">{employee.employee_code}</Chip>
              <Chip>{employee.name}</Chip>
              <Link
                href={`/employees/code/${employee.employee_code}/qualifications`}
                className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
              >
                資格管理へ戻る
              </Link>
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

        <form action={updateQualification} className="space-y-6">
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

          <Card className="p-6">
            <h2 className="text-xl font-black text-slate-900">資格情報</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              登録済みの資格情報を変更できます。
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="資格名">
                <input
                  name="qualification_name"
                  defaultValue={qualification.qualification_name ?? ""}
                  required
                  className="input"
                  placeholder="例：第一種衛生管理者"
                />
              </Field>

              <Field label="状態">
                <select
                  name="status"
                  defaultValue={qualification.status ?? "active"}
                  className="input"
                >
                  <option value="active">active</option>
                  <option value="expired">expired</option>
                  <option value="planned">planned</option>
                  <option value="suspended">suspended</option>
                </select>
              </Field>

              <Field label="取得日">
                <input
                  name="acquired_on"
                  type="date"
                  defaultValue={qualification.acquired_on ?? ""}
                  className="input"
                />
              </Field>

              <Field label="有効期限">
                <input
                  name="expires_on"
                  type="date"
                  defaultValue={qualification.expires_on ?? ""}
                  className="input"
                />
              </Field>

              <div className="md:col-span-2">
                <Field label="メモ">
                  <textarea
                    name="memo"
                    rows={4}
                    defaultValue={qualification.memo ?? ""}
                    className="input"
                    placeholder="更新予定、証明書の保管場所など"
                  />
                </Field>
              </div>
            </div>
          </Card>

          <div className="flex flex-col gap-3 md:flex-row md:justify-end">
            <Link
              href={`/employees/code/${employee.employee_code}/qualifications`}
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