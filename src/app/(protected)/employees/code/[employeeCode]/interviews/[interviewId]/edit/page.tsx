import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PageShell } from "@/components/ui/page-shell";
import { Card, Chip } from "@/components/ui/ux";

export const runtime = "nodejs";

export default async function InterviewEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ employeeCode: string; interviewId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const me = await requireAuth();
  const { employeeCode, interviewId } = await params;
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

  const { data: interview, error: interviewError } = await admin
    .from("employee_interviews")
    .select(
      "id, employee_id, interview_date, interview_type, interviewer_name, summary, action_items, next_interview_date"
    )
    .eq("id", interviewId)
    .eq("employee_id", employee.id)
    .maybeSingle();

  if (interviewError) throw interviewError;
  if (!interview) notFound();

async function updateInterview(formData: FormData) {
  "use server";

  const me = await requireAuth();
  if (me.role !== "admin" && me.role !== "hr") {
    redirect("/unauthorized");
  }

  const admin = createSupabaseAdminClient();

  const targetEmployeeCode = String(
    formData.get("employee_code") ?? ""
  ).trim();

  const targetInterviewId = String(
    formData.get("interview_id") ?? ""
  ).trim();

  const interviewDate =
    String(formData.get("interview_date") ?? "").trim() ||
    new Date().toISOString().slice(0, 10);

  const interviewType = String(
    formData.get("interview_type") ?? "regular"
  ).trim();

  const interviewerName = String(
    formData.get("interviewer_name") ?? ""
  ).trim();

  const summary = String(formData.get("summary") ?? "").trim();
  const actionItems = String(formData.get("action_items") ?? "").trim();

  const nextInterviewDateRaw = String(
    formData.get("next_interview_date") ?? ""
  ).trim();

  const nextInterviewDate =
    nextInterviewDateRaw === "" ? null : nextInterviewDateRaw;

  if (!targetInterviewId) {
    redirect(
      `/employees/code/${targetEmployeeCode}/interviews?error=${encodeURIComponent(
        "面談IDを取得できませんでした"
      )}`
    );
  }

  if (!summary) {
    redirect(
      `/employees/code/${targetEmployeeCode}/interviews/${targetInterviewId}/edit?error=${encodeURIComponent(
        "面談内容を入力してください"
      )}`
    );
  }

  // 対象面談の employee_id を取得
  const { data: targetInterview, error: targetInterviewError } = await admin
    .from("employee_interviews")
    .select("id, employee_id")
    .eq("id", targetInterviewId)
    .maybeSingle();

  if (targetInterviewError || !targetInterview) {
    redirect(
      `/employees/code/${targetEmployeeCode}/interviews/${targetInterviewId}/edit?error=${encodeURIComponent(
        targetInterviewError?.message ?? "面談情報を取得できませんでした"
      )}`
    );
  }

  // 面談履歴を更新
  const { error } = await admin
    .from("employee_interviews")
    .update({
      interview_date: interviewDate,
      interview_type: interviewType,
      interviewer_name: interviewerName,
      summary,
      action_items: actionItems,
      next_interview_date: nextInterviewDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", targetInterviewId);

  if (error) {
    redirect(
      `/employees/code/${targetEmployeeCode}/interviews/${targetInterviewId}/edit?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  // 次回面談予定日が空なら、連動イベントを削除
  if (!nextInterviewDate) {
    const { error: deleteEventError } = await admin
      .from("employee_annual_events")
      .delete()
      .eq("source_type", "employee_interview")
      .eq("source_id", targetInterviewId);

    if (deleteEventError) {
      redirect(
        `/employees/code/${targetEmployeeCode}/interviews/${targetInterviewId}/edit?error=${encodeURIComponent(
          deleteEventError.message
        )}`
      );
    }

    redirect(`/employees/code/${targetEmployeeCode}/interviews`);
  }

  // 次回面談予定日がある場合、連動イベントを更新。無ければ作成。
  const eventPayload = {
    employee_id: targetInterview.employee_id,
    title: "次回面談",
    event_type: "interview",
    scheduled_date: nextInterviewDate,
    status: "pending",
    priority: 2,
    description: actionItems
      ? `面談履歴から自動作成\n\n次回アクション:\n${actionItems}`
      : "面談履歴から自動作成",
    source_type: "employee_interview",
    source_id: targetInterviewId,
  };

  // まず既存の連動イベントをまとめて更新
  const { data: updatedEvents, error: updateEventError } = await admin
    .from("employee_annual_events")
    .update(eventPayload)
    .eq("source_type", "employee_interview")
    .eq("source_id", targetInterviewId)
    .select("id");

  if (updateEventError) {
    redirect(
      `/employees/code/${targetEmployeeCode}/interviews/${targetInterviewId}/edit?error=${encodeURIComponent(
        updateEventError.message
      )}`
    );
  }

  // 更新対象が無ければ新規作成
  if (!updatedEvents || updatedEvents.length === 0) {
    const { error: insertEventError } = await admin
      .from("employee_annual_events")
      .insert(eventPayload);

    if (insertEventError) {
      redirect(
        `/employees/code/${targetEmployeeCode}/interviews/${targetInterviewId}/edit?error=${encodeURIComponent(
          insertEventError.message
        )}`
      );
    }
  }

  redirect(`/employees/code/${targetEmployeeCode}/interviews`);
}
  return (
    <PageShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-xs font-black tracking-[0.18em] text-indigo-600">
                INTERVIEW EDIT
              </div>
              <h1 className="mt-2 text-3xl font-black text-slate-900">
                面談履歴の編集
              </h1>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                面談日、面談種別、内容、次回アクションを編集します。
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Chip tone="info">{employee.employee_code}</Chip>
              <Chip>{employee.name}</Chip>
              <Link
                href={`/employees/code/${employee.employee_code}/interviews`}
                className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
              >
                面談管理へ戻る
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

        <form action={updateInterview} className="space-y-6">
          <input
            type="hidden"
            name="employee_code"
            value={employee.employee_code}
          />
          <input type="hidden" name="interview_id" value={interview.id} />

          <Card className="p-6">
            <h2 className="text-xl font-black text-slate-900">面談情報</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              登録済みの面談内容を変更できます。
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="面談日">
                <input
                  name="interview_date"
                  type="date"
                  defaultValue={interview.interview_date ?? ""}
                  className="input"
                />
              </Field>

              <Field label="面談種別">
                <select
                  name="interview_type"
                  defaultValue={interview.interview_type ?? "regular"}
                  className="input"
                >
                  <option value="regular">定期面談</option>
                  <option value="follow">フォロー面談</option>
                  <option value="evaluation">評価面談</option>
                  <option value="career">キャリア面談</option>
                  <option value="other">その他</option>
                </select>
              </Field>

              <Field label="面談者">
                <input
                  name="interviewer_name"
                  defaultValue={interview.interviewer_name ?? ""}
                  className="input"
                  placeholder="例：山田 太郎"
                />
              </Field>
            </div>

            <div className="mt-4 space-y-4">
              <Field label="面談内容">
                <textarea
                  name="summary"
                  required
                  rows={6}
                  defaultValue={interview.summary ?? ""}
                  className="input"
                  placeholder="面談で話した内容、本人の状況、課題、希望など"
                />
              </Field>

              <Field label="次回アクション">
                <textarea
                  name="action_items"
                  rows={4}
                  defaultValue={interview.action_items ?? ""}
                  className="input"
                  placeholder="次回までに対応すること、確認すること"
                />
              </Field>

              <Field label="次回面談予定日">
                <input
                  name="next_interview_date"
                  type="date"
                  defaultValue={interview.next_interview_date ?? ""}
                  className="input"
                />
              </Field>
            </div>
          </Card>

          <div className="flex flex-col gap-3 md:flex-row md:justify-end">
            <Link
              href={`/employees/code/${employee.employee_code}/interviews`}
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