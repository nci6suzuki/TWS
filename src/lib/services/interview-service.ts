// src/lib/services/interview-service.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Me } from "@/types/api";
import { canCreateInterview } from "@/lib/permissions/can";
import { createNotification } from "@/lib/services/notification-service";

export async function createInterview(input: { me: Me; input: any }) {
  if (!canCreateInterview(input.me)) {
    throw new Error("FORBIDDEN");
  }

  const supabase = await createSupabaseServerClient();

  const { data: created, error: createErr } = await supabase
    .from("interview_records")
    .insert({
      employee_id: input.input.employeeId,
      interviewer_employee_id: input.input.interviewerEmployeeId,
      interview_date: input.input.interviewDate,
      interview_type: input.input.interviewType,
      assignment_id: input.input.assignmentId ?? null,
      annual_event_id: input.input.annualEventId ?? null,
      facts_observed: input.input.factsObserved ?? null,
      employee_voice: input.input.employeeVoice ?? null,
      positive_points: input.input.positivePoints ?? null,
      issues: input.input.issues ?? null,
      response_policy: input.input.responsePolicy ?? null,
      action_employee: input.input.actionEmployee ?? null,
      action_company: input.input.actionCompany ?? null,
      next_interview_date: input.input.nextInterviewDate ?? null,
      visibility: input.input.visibility,
    })
    .select("id, employee_id, assignment_id, annual_event_id")
    .single();

  if (createErr) throw createErr;

  // フォロー割当完了
  if (created.assignment_id && input.input.autoCompleteAssignment) {
    const { data: followupRow, error: followupErr } = await supabase
      .from("followup_assignments")
      .select("id, assignee_employee_id")
      .eq("id", created.assignment_id)
      .maybeSingle();

    if (followupErr) throw followupErr;

    const { error: updErr } = await supabase
      .from("followup_assignments")
      .update({ status: "done" })
      .eq("id", created.assignment_id);

    if (updErr) throw updErr;

    if (followupRow?.assignee_employee_id) {
      await createNotification({
        userEmployeeId: followupRow.assignee_employee_id,
        type: "followup_completed",
        title: "フォロー割当が完了しました",
        body: "面談記録の登録により、フォロー割当が完了になりました。",
        relatedTable: "followup_assignments",
        relatedId: created.assignment_id,
      });
    }
  }

  // 年間イベント完了
  if (created.annual_event_id && input.input.autoCompleteAnnualEvent) {
    const { data: annualEventRow, error: annualEventErr } = await supabase
      .from("employee_annual_events")
      .select("id, owner_employee_id, title")
      .eq("id", created.annual_event_id)
      .maybeSingle();

    if (annualEventErr) throw annualEventErr;

    const { error: eventUpdErr } = await supabase
      .from("employee_annual_events")
      .update({ status: "done" })
      .eq("id", created.annual_event_id);

    if (eventUpdErr) throw eventUpdErr;

    if (annualEventRow?.owner_employee_id) {
      await createNotification({
        userEmployeeId: annualEventRow.owner_employee_id,
        type: "annual_event_completed",
        title: "年間イベントが完了しました",
        body: `「${annualEventRow.title ?? "イベント"}」が面談記録の登録により完了になりました。`,
        relatedTable: "employee_annual_events",
        relatedId: created.annual_event_id,
      });
    }
  }

  await createNotification({
    userEmployeeId: input.input.interviewerEmployeeId,
    type: "interview_created",
    title: "面談記録を登録しました",
    body: "面談記録の保存が完了しました。",
    relatedTable: "interview_records",
    relatedId: created.id,
  });

  return { id: created.id };
}