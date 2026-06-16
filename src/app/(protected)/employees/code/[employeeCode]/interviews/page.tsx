// src/app/(protected)/employees/code/[employeeCode]/interviews/page.tsx

import Link from "next/link";
import { redirect, notFound } from "next/navigation";
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
  if (!employee) notFound();

  const canManage = me.role === "admin" || me.role === "hr";

  if (!canManage && me.employeeId !== employee.id) {
    redirect("/unauthorized");
  }

  const { data: interviews, error: interviewsError } = await admin
    .from("employee_interviews")
    .select(
      "id, employee_id, interview_date, interview_type, interviewer_name, summary, action_items, next_interview_date, next_interview_completed_at, created_at"
    )
    .eq("employee_id", employee.id)
    .order("interview_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (interviewsError) throw interviewsError;

  async function addInterview(formData: FormData) {
    "use server";

    const me = await requireAuth();

    if (me.role !== "admin" && me.role !== "hr") {
      redirect("/unauthorized");
    }

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

    const baseUrl = `/employees/code/${encodeURIComponent(
      targetEmployeeCode || code
    )}/interviews`;

    if (!targetEmployeeId || !targetEmployeeCode) {
      redirect(
        `${baseUrl}?error=${encodeURIComponent(
          "社員情報を取得できませんでした"
        )}`
      );
    }

    if (!summary) {
      redirect(
        `${baseUrl}?error=${encodeURIComponent("面談内容を入力してください")}`
      );
    }

    const now = new Date().toISOString();

    const { data: insertedInterview, error } = await admin
      .from("employee_interviews")
      .insert({
        employee_id: targetEmployeeId,
        interview_date: interviewDate,
        interview_type: interviewType || "regular",
        interviewer_name: interviewerName || null,
        summary,
        action_items: actionItems || null,
        next_interview_date: nextInterviewDate,
        updated_at: now,
      })
      .select(
        "id, employee_id, interview_date, interview_type, interviewer_name, summary, action_items, next_interview_date"
      )
      .single();

    if (error) {
      redirect(`${baseUrl}?error=${encodeURIComponent(error.message)}`);
    }

    let createdAnnualEventId: string | null = null;

    if (nextInterviewDate && insertedInterview?.id) {
      const { data: annualEvent, error: eventError } = await admin
        .from("employee_annual_events")
        .insert({
          employee_id: targetEmployeeId,
          title: "次回面談",
          event_type: "interview",
          scheduled_date: nextInterviewDate,
          status: "pending",
          priority: 2,
          description: actionItems
            ? `面談履歴から自動作成\n\n次回アクション:\n${actionItems}`
            : `面談履歴から自動作成\n\n元面談日：${interviewDate}`,
          source_type: "employee_interview",
          source_id: insertedInterview.id,
        })
        .select("id")
        .single();

      if (eventError) {
        redirect(
          `${baseUrl}?error=${encodeURIComponent(
            `面談履歴は登録されましたが、年間イベント作成に失敗しました: ${eventError.message}`
          )}`
        );
      }

      createdAnnualEventId = annualEvent?.id ?? null;
    }

    await createActivityLog({
      employeeId: targetEmployeeId,
      actorEmployeeId: me.employeeId,
      activityType: "interview_created",
      title: "面談記録を追加しました",
      description: `「${getInterviewTypeLabel(
        interviewType
      )}」を登録しました。面談日：${interviewDate}`,
      relatedType: "employee_interview",
      relatedId: insertedInterview.id,
      metadata: {
        interview_date: interviewDate,
        interview_type: interviewType,
        interviewer_name: interviewerName || null,
        summary,
        action_items: actionItems || null,
        next_interview_date: nextInterviewDate,
        created_annual_event_id: createdAnnualEventId,
      },
    });

    redirect(`${baseUrl}?created=${encodeURIComponent(interviewDate)}`);
  }

  const nextActionCount = (interviews ?? []).filter(
    (i: any) => i.action_items && i.action_items.trim() !== ""
  ).length;

  const nextInterviewCount = (interviews ?? []).filter(
    (i: any) => i.next_interview_date
  ).length;

  const pendingNextInterviewCount = (interviews ?? []).filter(
    (i: any) => i.next_interview_date && !i.next_interview_completed_at
  ).length;

  return (
    <PageShell>
      <div className="space-y-6">
        <Hero
          title="面談管理"
          subtitle="社員との面談記録、次回アクション、次回面談予定を管理します。登録内容はタイムラインにも履歴として残ります。"
          meta={
            <div className="flex flex-wrap gap-2">
              <Chip tone="info">Interviews</Chip>
              <Chip>
                {employee.employee_code} / {employee.name}
              </Chip>
              <Chip>登録数: {(interviews ?? []).length}</Chip>
              <Chip>次回アクション: {nextActionCount}</Chip>
              <Chip>次回面談予定: {nextInterviewCount}</Chip>
              {pendingNextInterviewCount > 0 && (
                <Chip tone="danger">
                  未完了の次回面談: {pendingNextInterviewCount}
                </Chip>
              )}
            </div>
          }
          right={
            <>
              <GhostButton href={`/employees/code/${employee.employee_code}`}>
                カルテへ戻る
              </GhostButton>
              <PrimaryButton
                href={`/employees/code/${employee.employee_code}?tab=interviews`}
              >
                面談タブへ
              </PrimaryButton>
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

        {created && (
          <Card className="border-emerald-200 bg-emerald-50 p-5">
            <div className="text-sm font-black text-emerald-700">
              面談記録を追加しました
            </div>
            <div className="mt-1 text-sm font-semibold text-emerald-600">
              面談日「{created}」の記録を追加し、タイムラインに履歴を保存しました。
            </div>
          </Card>
        )}

        {canManage && (
          <Card className="p-5">
            <div className="mb-5">
              <h2 className="text-lg font-black text-slate-900">
                面談記録を追加
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                次回面談予定を入力すると、年間イベントにも次回面談予定を作成します。
              </p>
            </div>

            <form action={addInterview} className="space-y-5">
              <input type="hidden" name="employee_id" value={employee.id} />
              <input
                type="hidden"
                name="employee_code"
                value={employee.employee_code}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block">
                  <div className="mb-1 text-sm font-black text-slate-700">
                    面談日 <span className="text-rose-500">*</span>
                  </div>
                  <input
                    className="input"
                    type="date"
                    name="interview_date"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    required
                  />
                </label>

                <label className="block">
                  <div className="mb-1 text-sm font-black text-slate-700">
                    面談種別
                  </div>
                  <select
                    className="input"
                    name="interview_type"
                    defaultValue="regular"
                  >
                    <option value="regular">定期面談</option>
                    <option value="career">キャリア面談</option>
                    <option value="followup">フォロー面談</option>
                    <option value="evaluation">評価面談</option>
                    <option value="other">その他</option>
                  </select>
                </label>

                <label className="block">
                  <div className="mb-1 text-sm font-black text-slate-700">
                    面談者
                  </div>
                  <input
                    className="input"
                    name="interviewer_name"
                    placeholder="例：鈴木"
                  />
                </label>

                <label className="block">
                  <div className="mb-1 text-sm font-black text-slate-700">
                    次回面談予定日
                  </div>
                  <input
                    className="input"
                    type="date"
                    name="next_interview_date"
                  />
                </label>
              </div>

              <label className="block">
                <div className="mb-1 text-sm font-black text-slate-700">
                  面談内容・要約 <span className="text-rose-500">*</span>
                </div>
                <textarea
                  className="input min-h-32"
                  name="summary"
                  placeholder="面談で話した内容、本人の状況、課題など"
                  required
                />
              </label>

              <label className="block">
                <div className="mb-1 text-sm font-black text-slate-700">
                  次回アクション
                </div>
                <textarea
                  className="input min-h-28"
                  name="action_items"
                  placeholder="次回までに実施すること、フォロー事項など"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  className="inline-flex h-11 items-center rounded-xl bg-slate-900 px-5 text-sm font-black text-white hover:bg-slate-800"
                >
                  面談記録を追加
                </button>

                <Link
                  href={`/employees/code/${employee.employee_code}?tab=interviews`}
                  className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 hover:bg-slate-50"
                >
                  戻る
                </Link>
              </div>
            </form>
          </Card>
        )}

        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-black text-slate-900">
              登録済み面談
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              面談記録の編集・削除もタイムラインへ履歴として残せるようにします。
            </p>
          </div>

          <div className="overflow-auto">
            <table className="min-w-[1100px] w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="px-4 py-3 text-left font-black">面談日</th>
                  <th className="px-4 py-3 text-left font-black">種別</th>
                  <th className="px-4 py-3 text-left font-black">面談者</th>
                  <th className="px-4 py-3 text-left font-black">内容</th>
                  <th className="px-4 py-3 text-left font-black">次回予定</th>
                  <th className="px-4 py-3 text-left font-black">操作</th>
                </tr>
              </thead>

              <tbody>
                {(interviews ?? []).length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-sm font-bold text-slate-500"
                    >
                      登録済み面談はありません
                    </td>
                  </tr>
                ) : (
                  (interviews ?? []).map((i: any) => (
                    <tr
                      key={i.id}
                      className="border-b border-slate-100 bg-white hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 font-black text-slate-900">
                        {i.interview_date || "-"}
                      </td>

                      <td className="px-4 py-3">
                        <Chip tone="info">
                          {getInterviewTypeLabel(i.interview_type)}
                        </Chip>
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {i.interviewer_name || "-"}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        <div className="line-clamp-2 max-w-[320px] whitespace-pre-wrap">
                          {i.summary || "-"}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {i.next_interview_date ? (
                          <Chip
                            tone={
                              i.next_interview_completed_at ? "ok" : "danger"
                            }
                          >
                            {i.next_interview_completed_at
                              ? "完了済"
                              : i.next_interview_date}
                          </Chip>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {canManage ? (
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/employees/code/${employee.employee_code}/interviews/${i.id}/edit`}
                              className="inline-flex h-8 items-center rounded-lg bg-slate-900 px-3 text-xs font-black text-white hover:bg-slate-800"
                            >
                              編集
                            </Link>

                            <DeleteInterviewButton
                              interviewId={i.id}
                              employeeCode={employee.employee_code}
                            />
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400">
                            閲覧のみ
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

function getInterviewTypeLabel(type: string) {
  if (type === "regular") return "定期面談";
  if (type === "career") return "キャリア面談";
  if (type === "followup") return "フォロー面談";
  if (type === "evaluation") return "評価面談";
  if (type === "other") return "その他";
  return type || "面談";
}