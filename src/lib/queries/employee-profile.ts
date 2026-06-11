// src/lib/queries/employee-profile.ts
import { createSupabaseServerDbClient } from "@/lib/supabase/server-db";

export async function getEmployeeProfileBookById(employeeId: string) {
  const supabase = await createSupabaseServerDbClient();

  // 基本（employees）
  const { data: emp, error: empErr } = await supabase
    .from("employees")
    .select("id, employee_code, name, email, app_role, status, hire_date")
    .eq("id", employeeId)
    .maybeSingle();

  if (empErr) throw empErr;
  if (!emp) return null;

  // プロフィール（任意）
  const { data: profile } = await supabase
    .from("employee_profiles")
    .select("career_summary, strengths, current_issues, notes_hr")
    .eq("employee_id", employeeId)
    .maybeSingle();

  // キャリア希望（任意）
  const { data: goals } = await supabase
    .from("employee_career_goals")
    .select("goal_1y, goal_3y, desired_role, desired_career_path, reskilling_interest, mobility_preference, self_comment")
    .eq("employee_id", employeeId)
    .maybeSingle();

  // 資格（期限順）
  const { data: qualifications } = await supabase
    .from("employee_qualifications")
    .select(`
      id,
      acquired_on,
      expires_on,
      status,
      note,
      qualification_master:qualification_id ( id, name )
    `)
    .eq("employee_id", employeeId)
    .order("expires_on", { ascending: true });

  // 年間イベント（直近順：まずは先3ヶ月/20件）
  const { data: events } = await supabase
    .from("employee_annual_events")
    .select("id, scheduled_date, title, event_type, status, priority, owner_employee_id")
    .eq("employee_id", employeeId)
    .order("scheduled_date", { ascending: true })
    .limit(50);

  // 面談履歴（直近）
  const { data: interviews } = await supabase
    .from("interview_records")
    .select("id, interview_date, interview_type, interviewer_employee_id, notes, next_actions, annual_event_id")
    .eq("employee_id", employeeId)
    .order("interview_date", { ascending: false })
    .limit(30);

  return {
    employee: emp,
    profile: profile ?? null,
    goals: goals ?? null,
    qualifications: qualifications ?? [],
    events: events ?? [],
    interviews: interviews ?? [],
  };
}

export async function getEmployeeProfileBookByCode(employeeCode: string) {
  const supabase = await createSupabaseServerDbClient();
  const code = decodeURIComponent(employeeCode).trim();

  // employeesを社員番号で直接取得（ここが一番確実）
  const { data: emp, error: empErr } = await supabase
    .from("employees")
    .select("id, employee_code, name, email, app_role, status, hire_date")
    .eq("employee_code", code)
    .maybeSingle();

  if (empErr) throw empErr;
  if (!emp) return null;

  const employeeId = emp.id;

  const { data: profile } = await supabase
    .from("employee_profiles")
    .select("career_summary, strengths, current_issues, notes_hr")
    .eq("employee_id", employeeId)
    .maybeSingle();

  const { data: goals } = await supabase
    .from("employee_career_goals")
    .select("goal_1y, goal_3y, desired_role, desired_career_path, reskilling_interest, mobility_preference, self_comment")
    .eq("employee_id", employeeId)
    .maybeSingle();

const { data: qualifications } = await supabase
  .from("employee_qualifications")
  .select("id, qualification_name, acquired_on, expires_on, status, memo")
  .eq("employee_id", employeeId)
  .order("expires_on", { ascending: true, nullsFirst: false });

const { data: events } = await supabase
  .from("employee_annual_events")
  .select(
    "id, title, event_type, scheduled_date, status, priority, description, source_type, source_id"
  )
  .eq("employee_id", employeeId)
  .order("scheduled_date", { ascending: true });

const { data: interviews } = await supabase
  .from("employee_interviews")
.select(
  "id, interview_date, interview_type, interviewer_name, summary, action_items, next_interview_date, next_interview_completed_at, created_at"
)
  .eq("employee_id", employeeId)
  .order("interview_date", { ascending: false })
  .order("created_at", { ascending: false });

  return {
    employee: emp,
    profile: profile ?? null,
    goals: goals ?? null,
    qualifications: qualifications ?? [],
    events: events ?? [],
    interviews: interviews ?? [],
  };
}