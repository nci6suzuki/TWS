// src/lib/queries/employee-profile.ts

import { createSupabaseServerDbClient } from "@/lib/supabase/server-db";

export async function getEmployeeProfileBookById(employeeId: string) {
  const supabase = await createSupabaseServerDbClient();

  // 基本（employees）
  const { data: emp, error: empErr } = await supabase
    .from("employees")
    .select(
      "id, employee_code, name, email, app_role, status, hire_date, birth_date, gender, is_management_role, organization_unit_id, manager_employee_id, position_title, position_started_on"
    )
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
    .select(
      "goal_1y, goal_3y, desired_role, desired_career_path, reskilling_interest, mobility_preference, self_comment"
    )
    .eq("employee_id", employeeId)
    .maybeSingle();

  // 資格
  const { data: qualifications } = await supabase
    .from("employee_qualifications")
    .select("id, qualification_name, acquired_on, expires_on, status, memo")
    .eq("employee_id", employeeId)
    .order("expires_on", { ascending: true, nullsFirst: false });

  // 年間イベント
  const { data: events } = await supabase
    .from("employee_annual_events")
    .select(
      "id, title, event_type, scheduled_date, status, priority, description, source_type, source_id"
    )
    .eq("employee_id", employeeId)
    .order("scheduled_date", { ascending: true });

  // 面談履歴
  const { data: interviews } = await supabase
    .from("employee_interviews")
    .select(
      "id, interview_date, interview_type, interviewer_name, summary, action_items, next_interview_date, next_interview_completed_at, created_at"
    )
    .eq("employee_id", employeeId)
    .order("interview_date", { ascending: false })
    .order("created_at", { ascending: false });

  // 操作履歴・対応履歴
  const activityLogs = await getEmployeeActivityLogs(supabase, employeeId);

  return {
    employee: emp,
    profile: profile ?? null,
    goals: goals ?? null,
    qualifications: qualifications ?? [],
    events: events ?? [],
    interviews: interviews ?? [],
    activityLogs,
  };
}

export async function getEmployeeProfileBookByCode(employeeCode: string) {
  const supabase = await createSupabaseServerDbClient();
  const code = decodeURIComponent(employeeCode).trim();

  // employeesを社員番号で直接取得
  const { data: emp, error: empErr } = await supabase
    .from("employees")
    .select(
      "id, employee_code, name, email, app_role, status, hire_date, birth_date, gender, is_management_role, organization_unit_id, manager_employee_id, position_title, position_started_on"
    )
    .eq("employee_code", code)
    .maybeSingle();

  if (empErr) throw empErr;
  if (!emp) return null;

  const employeeId = emp.id;

  // プロフィール（任意）
  const { data: profile } = await supabase
    .from("employee_profiles")
    .select("career_summary, strengths, current_issues, notes_hr")
    .eq("employee_id", employeeId)
    .maybeSingle();

  // キャリア希望（任意）
  const { data: goals } = await supabase
    .from("employee_career_goals")
    .select(
      "goal_1y, goal_3y, desired_role, desired_career_path, reskilling_interest, mobility_preference, self_comment"
    )
    .eq("employee_id", employeeId)
    .maybeSingle();

  // 資格
  const { data: qualifications } = await supabase
    .from("employee_qualifications")
    .select("id, qualification_name, acquired_on, expires_on, status, memo")
    .eq("employee_id", employeeId)
    .order("expires_on", { ascending: true, nullsFirst: false });

  // 年間イベント
  const { data: events } = await supabase
    .from("employee_annual_events")
    .select(
      "id, title, event_type, scheduled_date, status, priority, description, source_type, source_id"
    )
    .eq("employee_id", employeeId)
    .order("scheduled_date", { ascending: true });

  // 面談履歴
  const { data: interviews } = await supabase
    .from("employee_interviews")
    .select(
      "id, interview_date, interview_type, interviewer_name, summary, action_items, next_interview_date, next_interview_completed_at, created_at"
    )
    .eq("employee_id", employeeId)
    .order("interview_date", { ascending: false })
    .order("created_at", { ascending: false });

  // 操作履歴・対応履歴
  const activityLogs = await getEmployeeActivityLogs(supabase, employeeId);

  return {
    employee: emp,
    profile: profile ?? null,
    goals: goals ?? null,
    qualifications: qualifications ?? [],
    events: events ?? [],
    interviews: interviews ?? [],
    activityLogs,
  };
}

async function getEmployeeActivityLogs(supabase: any, employeeId: string) {
  const { data: activityLogs, error } = await supabase
    .from("employee_activity_logs")
    .select(
      "id, employee_id, actor_employee_id, activity_type, title, description, related_type, related_id, metadata, created_at"
    )
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("employee_activity_logs select error:", error.message);
    return [];
  }

  const actorEmployeeIds = Array.from(
    new Set(
      (activityLogs ?? [])
        .map((log: any) => log.actor_employee_id)
        .filter(Boolean)
    )
  );

  const { data: actorEmployees } =
    actorEmployeeIds.length > 0
      ? await supabase
          .from("employees")
          .select("id, employee_code, name")
          .in("id", actorEmployeeIds)
      : { data: [] as any[] };

  const actorEmployeeById = new Map(
    (actorEmployees ?? []).map((actor: any) => [actor.id, actor])
  );

  return (activityLogs ?? []).map((log: any) => ({
    ...log,
    actor_employee: log.actor_employee_id
      ? actorEmployeeById.get(log.actor_employee_id) ?? null
      : null,
  }));
}