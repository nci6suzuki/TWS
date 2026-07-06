// src/app/(protected)/employees/code/[employeeCode]/interviews/[interviewId]/edit/page.tsx

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
import { buttonClassName } from "@/lib/ui/button-class";
import { SubmitButton } from "@/components/ui/submit-button";

export const runtime = "nodejs";

export default async function InterviewEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ employeeCode: string; interviewId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const me = await requireAuth();

  if (me.role !== "admin" && me.role !== "hr") {
    redirect("/unauthorized");
  }

  const { employeeCode, interviewId } = await params;
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
  if (!employee) notFound();

  const { data: interview, error: interviewError } = await admin
    .from("employee_interviews")
    .select(
      "id, employee_id, interview_date, interview_type, interviewer_name, summary, action_items, next_interview_date, next_interview_completed_at, created_at"
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

    const targetEmployeeId = String(formData.get("employee_id") ?? "").trim();
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

    const baseUrl = `/employees/code/${encodeURIComponent(
      targetEmployeeCode
    )}/interviews/${targetInterviewId}/edit`;

    const listUrl = `/employees/code/${encodeURIComponent(
      targetEmployeeCode
    )}/interviews`;

    if (!targetEmployeeId || !targetEmployeeCode || !targetInterviewId) {
      redirect(
        `/employees?error=${encodeURIComponent(
          "面談情報を取得できませんでした"
        )}`
      );
    }

    if (!summary) {
      redirect(
        `${baseUrl}?error=${encodeURIComponent("面談内容を入力してください")}`
      );
    }

    const { data: beforeInterview, error: beforeError } = await admin
      .from("employee_interviews")
      .select(
        "id, employee_id, interview_date, interview_type, interviewer_name, summary, action_items, next_interview_date, next_interview_completed_at"
      )
      .eq("id", targetInterviewId)
      .eq("employee_id", targetEmployeeId)
      .maybeSingle();

    if (beforeError) {
      redirect(`${baseUrl}?error=${encodeURIComponent(beforeError.message)}`);
    }

    if (!beforeInterview) {
      redirect(
        `${listUrl}?error=${encodeURIComponent("面談記録が見つかりません")}`
      );
    }

    const updatedAt = new Date().toISOString();

    const { data: updatedInterview, error } = await admin
      .from("employee_interviews")
      .update({
        interview_date: interviewDate,
        interview_type: interviewType || "regular",
        interviewer_name: interviewerName || null,
        summary,
        action_items: actionItems || null,
        next_interview_date: nextInterviewDate,
        updated_at: updatedAt,
      })
      .eq("id", targetInterviewId)
      .eq("employee_id", targetEmployeeId)
      .select(
        "id, employee_id, interview_date, interview_type, interviewer_name, summary, action_items, next_interview_date, next_interview_completed_at"
      )
      .single();

    if (error) {
      redirect(`${baseUrl}?error=${encodeURIComponent(error.message)}`);
    }

    let linkedAnnualEventAction: "deleted" | "updated" | "created" | "none" =
      "none";
    let linkedAnnualEventId: string | null = null;

    if (!nextInterviewDate) {
      const { data: deletedEvents, error: deleteEventError } = await admin
        .from("employee_annual_events")
        .delete()
        .eq("source_type", "employee_interview")
        .eq("source_id", targetInterviewId)
        .select("id");

      if (deleteEventError) {
        redirect(
          `${baseUrl}?error=${encodeURIComponent(deleteEventError.message)}`
        );
      }

      if ((deletedEvents ?? []).length > 0) {
        linkedAnnualEventAction = "deleted";
        linkedAnnualEventId = deletedEvents?.[0]?.id ?? null;
      }
    } else {
      const eventPayload = {
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
        source_id: targetInterviewId,
      };

      const { data: updatedEvents, error: updateEventError } = await admin
        .from("employee_annual_events")
        .update(eventPayload)
        .eq("source_type", "employee_interview")
        .eq("source_id", targetInterviewId)
        .select("id");

      if (updateEventError) {
        redirect(
          `${baseUrl}?error=${encodeURIComponent(updateEventError.message)}`
        );
      }

      if (updatedEvents && updatedEvents.length > 0) {
        linkedAnnualEventAction = "updated";
        linkedAnnualEventId = updatedEvents[0].id;
      } else {
        const { data: insertedEvent, error: insertEventError } = await admin
          .from("employee_annual_events")
          .insert(eventPayload)
          .select("id")
          .single();

        if (insertEventError) {
          redirect(
            `${baseUrl}?error=${encodeURIComponent(insertEventError.message)}`
          );
        }

        linkedAnnualEventAction = "created";
        linkedAnnualEventId = insertedEvent?.id ?? null;
      }
    }

    await createActivityLog({
      employeeId: targetEmployeeId,
      actorEmployeeId: me.employeeId,
      activityType: "interview_updated",
      title: "面談記録を編集しました",
      description: `「${getInterviewTypeLabel(
        interviewType
      )}」を編集しました。面談日：${interviewDate}`,
      relatedType: "employee_interview",
      relatedId: updatedInterview.id,
      metadata: {
        before: {
          interview_date: beforeInterview.interview_date,
          interview_type: beforeInterview.interview_type,
          interviewer_name: beforeInterview.interviewer_name,
          summary: beforeInterview.summary,
          action_items: beforeInterview.action_items,
          next_interview_date: beforeInterview.next_interview_date,
          next_interview_completed_at:
            beforeInterview.next_interview_completed_at,
        },
        after: {
          interview_date: updatedInterview.interview_date,
          interview_type: updatedInterview.interview_type,
          interviewer_name: updatedInterview.interviewer_name,
          summary: updatedInterview.summary,
          action_items: updatedInterview.action_items,
          next_interview_date: updatedInterview.next_interview_date,
          next_interview_completed_at:
            updatedInterview.next_interview_completed_at,
        },
        linked_annual_event_action: linkedAnnualEventAction,
        linked_annual_event_id: linkedAnnualEventId,
        updated_at: updatedAt,
      },
    });

    redirect(`${baseUrl}?updated=${encodeURIComponent(interviewDate)}`);
  }

  return (
    <PageShell>
      <div className="space-y-6">
        <Hero
          title="面談記録編集"
          subtitle="面談日、面談種別、面談内容、次回アクションを編集します。編集内容はタイムラインにも履歴として残ります。"
          meta={
            <div className="flex flex-wrap gap-2">
              <Chip tone="info">Interview Edit</Chip>
              <Chip>
                {employee.employee_code} / {employee.name}
              </Chip>
              <Chip>面談日: {interview.interview_date}</Chip>
            </div>
          }
          right={
            <>
              <GhostButton
                href={`/employees/code/${employee.employee_code}/interviews`}
              >
                面談管理へ戻る
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

        {updated && (
          <Card className="border-emerald-200 bg-emerald-50 p-5">
            <div className="text-sm font-black text-emerald-700">
              面談記録を編集しました
            </div>
            <div className="mt-1 text-sm font-semibold text-emerald-600">
              面談日「{updated}」の記録を更新し、タイムラインに履歴を保存しました。
            </div>
          </Card>
        )}

        <Card className="p-5">
          <div className="mb-5">
            <h2 className="text-lg font-black text-slate-900">編集内容</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              次回面談予定日を変更すると、連動する年間イベントも更新されます。
            </p>
          </div>

          <form action={updateInterview} className="space-y-5">
            <input type="hidden" name="employee_id" value={employee.id} />
            <input
              type="hidden"
              name="employee_code"
              value={employee.employee_code}
            />
            <input type="hidden" name="interview_id" value={interview.id} />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <div className="mb-1 text-sm font-black text-slate-700">
                  面談日 <span className="text-rose-500">*</span>
                </div>
                <input
                  className="input"
                  type="date"
                  name="interview_date"
                  defaultValue={interview.interview_date ?? ""}
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
                  defaultValue={interview.interview_type ?? "regular"}
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
                  defaultValue={interview.interviewer_name ?? ""}
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
                  defaultValue={interview.next_interview_date ?? ""}
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
                defaultValue={interview.summary ?? ""}
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
                defaultValue={interview.action_items ?? ""}
                placeholder="次回までに実施すること、フォロー事項など"
              />
            </label>

            <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
              <div className="text-xs font-semibold text-slate-400">
                保存すると、面談編集の履歴がタイムラインに記録されます。
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Link
                  href={`/employees/code/${employee.employee_code}/interviews`}
                  className={buttonClassName(
                    "inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 hover:bg-slate-50"
                  )}
                >
                  面談管理へ戻る
                </Link>

                <Link
                  href={`/employees/code/${employee.employee_code}?tab=interviews`}
                  className={buttonClassName(
                    "inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 hover:bg-slate-50"
                  )}
                >
                  面談タブへ戻る
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

function getInterviewTypeLabel(type: string) {
  if (type === "regular") return "定期面談";
  if (type === "career") return "キャリア面談";
  if (type === "followup") return "フォロー面談";
  if (type === "evaluation") return "評価面談";
  if (type === "other") return "その他";
  return type || "面談";
}