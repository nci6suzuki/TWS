import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PageShell } from "@/components/ui/page-shell";
import { Card, Chip } from "@/components/ui/ux";
import { DeleteInterviewButton } from "@/components/employees/delete-interview-button";

export const runtime = "nodejs";

export default async function EmployeeInterviewsPage({
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

  const { data: interviews, error: interviewsError } = await admin
    .from("employee_interviews")
.select(
  "id, interview_date, interview_type, interviewer_name, summary, action_items, next_interview_date, next_interview_completed_at, created_at"
)
    .eq("employee_id", employee.id)
    .order("interview_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (interviewsError) throw interviewsError;

  async function addInterview(formData: FormData) {
    "use server";

    const me = await requireAuth();
    if (me.role !== "admin" && me.role !== "hr") redirect("/unauthorized");

    const admin = createSupabaseAdminClient();

    const targetEmployeeId = String(formData.get("employee_id") ?? "").trim();
    const targetEmployeeCode = String(
      formData.get("employee_code") ?? ""
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

    if (!targetEmployeeId || !targetEmployeeCode) {
      redirect(
        `/employees/code/${targetEmployeeCode || employeeCode}/interviews?error=${encodeURIComponent(
          "社員情報を取得できませんでした"
        )}`
      );
    }

    if (!summary) {
      redirect(
        `/employees/code/${targetEmployeeCode}/interviews?error=${encodeURIComponent(
          "面談内容を入力してください"
        )}`
      );
    }

const { data: insertedInterview, error } = await admin
  .from("employee_interviews")
  .insert({
    employee_id: targetEmployeeId,
    interview_date: interviewDate,
    interview_type: interviewType,
    interviewer_name: interviewerName,
    summary,
    action_items: actionItems,
    next_interview_date: nextInterviewDate,
    updated_at: new Date().toISOString(),
  })
  .select("id")
  .single();

if (error) {
  redirect(
    `/employees/code/${targetEmployeeCode}/interviews?error=${encodeURIComponent(
      error.message
    )}`
  );
}

/**
 * 次回面談予定日がある場合、年間イベントを自動作成
 */
if (nextInterviewDate && insertedInterview?.id) {
  const eventTitle = "次回面談";

  const { error: eventError } = await admin
    .from("employee_annual_events")
    .insert({
      employee_id: targetEmployeeId,
      title: eventTitle,
      event_type: "interview",
      scheduled_date: nextInterviewDate,
      status: "pending",
      priority: 2,
      description: actionItems
        ? `面談履歴から自動作成\n\n次回アクション:\n${actionItems}`
        : "面談履歴から自動作成",
      source_type: "employee_interview",
      source_id: insertedInterview.id,
    });

  if (eventError) {
    redirect(
      `/employees/code/${targetEmployeeCode}/interviews?error=${encodeURIComponent(
        `面談履歴は登録されましたが、年間イベント作成に失敗しました: ${eventError.message}`
      )}`
    );
  }
}

redirect(`/employees/code/${targetEmployeeCode}/interviews`);
  }

async function deleteInterview(formData: FormData) {
  "use server";

  const me = await requireAuth();
  if (me.role !== "admin" && me.role !== "hr") redirect("/unauthorized");

  const admin = createSupabaseAdminClient();

  const interviewId = String(formData.get("interview_id") ?? "").trim();
  const targetEmployeeCode = String(
    formData.get("employee_code") ?? ""
  ).trim();

  if (!interviewId) {
    redirect(`/employees/code/${targetEmployeeCode}/interviews`);
  }

  // 先に連動している年間イベントを削除
  const { error: eventDeleteError } = await admin
    .from("employee_annual_events")
    .delete()
    .eq("source_type", "employee_interview")
    .eq("source_id", interviewId);

  if (eventDeleteError) {
    redirect(
      `/employees/code/${targetEmployeeCode}/interviews?error=${encodeURIComponent(
        eventDeleteError.message
      )}`
    );
  }

  // その後、面談履歴を削除
  const { error } = await admin
    .from("employee_interviews")
    .delete()
    .eq("id", interviewId);

  if (error) {
    redirect(
      `/employees/code/${targetEmployeeCode}/interviews?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  redirect(`/employees/code/${targetEmployeeCode}/interviews`);
}

  const nextActionCount = (interviews ?? []).filter(
    (i) => i.action_items && i.action_items.trim() !== ""
  ).length;

  const nextInterviewCount = (interviews ?? []).filter(
    (i) => i.next_interview_date
  ).length;

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <Card className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-xs font-black tracking-[0.18em] text-indigo-600">
                INTERVIEWS
              </div>
              <h1 className="mt-2 text-3xl font-black text-slate-900">
                面談履歴
              </h1>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                面談内容、次回アクション、次回面談予定を記録します。
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

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Card className="p-5">
            <div className="text-xs font-black tracking-[0.12em] text-slate-500">
              面談件数
            </div>
            <div className="mt-2 text-3xl font-black text-slate-900">
              {interviews?.length ?? 0}
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-xs font-black tracking-[0.12em] text-slate-500">
              アクションあり
            </div>
            <div className="mt-2 text-3xl font-black text-indigo-600">
              {nextActionCount}
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-xs font-black tracking-[0.12em] text-slate-500">
              次回面談予定あり
            </div>
            <div className="mt-2 text-3xl font-black text-emerald-600">
              {nextInterviewCount}
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
            <h2 className="text-xl font-black text-slate-900">
              面談履歴を追加
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              面談日、面談種別、内容、次回アクションを登録します。
            </p>

            <form action={addInterview} className="mt-5 space-y-4">
              <input type="hidden" name="employee_id" value={employee.id} />
              <input
                type="hidden"
                name="employee_code"
                value={employee.employee_code}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="面談日">
                  <input
                    name="interview_date"
                    type="date"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    className="input"
                  />
                </Field>

                <Field label="面談種別">
                  <select
                    name="interview_type"
                    defaultValue="regular"
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
                    className="input"
                    placeholder="例：山田 太郎"
                  />
                </Field>
              </div>

              <Field label="面談内容">
                <textarea
                  name="summary"
                  required
                  rows={5}
                  className="input"
                  placeholder="面談で話した内容、本人の状況、課題、希望など"
                />
              </Field>

              <Field label="次回アクション">
                <textarea
                  name="action_items"
                  rows={3}
                  className="input"
                  placeholder="次回までに対応すること、確認すること"
                />
              </Field>

              <Field label="次回面談予定日">
                <input
                  name="next_interview_date"
                  type="date"
                  className="input"
                />
              </Field>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-5 text-sm font-black text-white hover:bg-slate-800"
                >
                  面談履歴を追加
                </button>
              </div>
            </form>
          </Card>
        )}

        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-black text-slate-900">面談一覧</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              新しい面談履歴から順に表示します。
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {(interviews ?? []).map((i) => (
              <div key={i.id} className="p-5 hover:bg-slate-50">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Chip tone="info">{i.interview_date}</Chip>
                      <Chip>{getInterviewTypeLabel(i.interview_type)}</Chip>
{i.next_interview_date && !i.next_interview_completed_at && (
  <Chip tone="ok">次回: {i.next_interview_date}</Chip>
)}

{i.next_interview_completed_at && (
  <Chip tone="info">
    次回面談完了:{" "}
    {String(i.next_interview_completed_at).slice(0, 10)}
  </Chip>
)}
                    </div>

                    <div className="mt-3 text-sm font-black text-slate-900">
                      面談者：{i.interviewer_name || "-"}
                    </div>

                    <div className="mt-3 rounded-2xl bg-slate-50 p-4">
                      <div className="text-xs font-black text-slate-500">
                        面談内容
                      </div>
                      <div className="mt-2 whitespace-pre-wrap text-sm font-semibold text-slate-700">
                        {i.summary || "-"}
                      </div>
                    </div>

                    {i.action_items && (
                      <div className="mt-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                        <div className="text-xs font-black text-indigo-700">
                          次回アクション
                        </div>
                        <div className="mt-2 whitespace-pre-wrap text-sm font-semibold text-indigo-700">
                          {i.action_items}
                        </div>
                      </div>
                    )}
                  </div>

{canManage && (
  <div className="flex flex-wrap gap-2">
    <Link
      href={`/employees/code/${employee.employee_code}/interviews/${i.id}/edit`}
      className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:bg-slate-50"
    >
      編集
    </Link>

<DeleteInterviewButton
  employeeCode={employee.employee_code}
  interviewId={i.id}
  returnTo={`/employees/code/${employee.employee_code}/interviews`}
/>
  </div>
)}
                </div>
              </div>
            ))}

            {(interviews ?? []).length === 0 && (
              <div className="px-5 py-12 text-center text-sm font-bold text-slate-500">
                面談履歴はありません
              </div>
            )}
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

function getInterviewTypeLabel(type: string) {
  if (type === "regular") return "定期面談";
  if (type === "follow") return "フォロー面談";
  if (type === "evaluation") return "評価面談";
  if (type === "career") return "キャリア面談";
  return "その他";
}