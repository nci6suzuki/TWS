// src/lib/services/followup-service.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Me } from "@/types/api";

export async function completeFollowup(input: { me: Me; followupId: string; interviewRecordId?: string }) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("followup_assignments")
    .select("id, assignee_employee_id, status")
    .eq("id", input.followupId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("NOT_FOUND");

  const isAssignee = input.me.employeeId === data.assignee_employee_id;
  const isHrAdmin = input.me.role === "admin" || input.me.role === "hr";
  if (!isAssignee && !isHrAdmin) throw new Error("FORBIDDEN");

  const { error: updErr } = await supabase
    .from("followup_assignments")
    .update({ status: "done" })
    .eq("id", input.followupId);

  if (updErr) throw updErr;

  return { ok: true };
}

export async function updateFollowup(input: {
  me: Me;
  followupId: string;
  input: {
    fiscalYear?: number;
    quarter?: number;
    employeeId?: string;
    followupType?: string;
    assigneeEmployeeId?: string;
    dueDate?: string;
    priority?: number;
    note?: string;
    status?: string;
  };
}) {
  const supabase = createSupabaseServerClient();

  const { data: existing, error } = await supabase
    .from("followup_assignments")
    .select("id, assignee_employee_id")
    .eq("id", input.followupId)
    .maybeSingle();

  if (error) throw error;
  if (!existing) throw new Error("NOT_FOUND");

  const isHrAdmin = input.me.role === "admin" || input.me.role === "hr";
  const isAssignee = input.me.employeeId === existing.assignee_employee_id;

  if (!isHrAdmin && !isAssignee) throw new Error("FORBIDDEN");

  const patch: Record<string, any> = {};

  if (input.input.fiscalYear !== undefined) patch.fiscal_year = input.input.fiscalYear;
  if (input.input.quarter !== undefined) patch.quarter = input.input.quarter;
  if (input.input.employeeId !== undefined) patch.employee_id = input.input.employeeId;
  if (input.input.followupType !== undefined) patch.followup_type = input.input.followupType;
  if (input.input.assigneeEmployeeId !== undefined) patch.assignee_employee_id = input.input.assigneeEmployeeId;
  if (input.input.dueDate !== undefined) patch.due_date = input.input.dueDate;
  if (input.input.priority !== undefined) patch.priority = input.input.priority;
  if (input.input.note !== undefined) patch.note = input.input.note;
  if (input.input.status !== undefined) patch.status = input.input.status;

  const { error: updErr } = await supabase
    .from("followup_assignments")
    .update(patch)
    .eq("id", input.followupId);

  if (updErr) throw updErr;

  return { id: input.followupId };
}