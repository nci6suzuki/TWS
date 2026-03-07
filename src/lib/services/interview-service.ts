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
    .select("id, employee_id, assignment_id")
    .single();

  if (createErr) throw createErr;

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