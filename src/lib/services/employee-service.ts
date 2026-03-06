// src/lib/services/employee-service.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Me } from "@/types/api";
import { applyAnnualTemplateToEmployee } from "@/lib/services/template-service";

export async function createEmployee({
  me,
  input,
}: {
  me: Me;
  input: {
    employeeCode: string;
    name: string;
    email: string;
    branchId: string;
    departmentId: string;
    positionId: string;
    gradeId: string;
    employmentType: string;
    hireDate: string;
    managerEmployeeId?: string;
    mentorEmployeeId?: string;
    status: string;
    templateId?: string;
    hrEmployeeId?: string;
  };
}) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("employees")
    .insert({
      employee_code: input.employeeCode,
      name: input.name,
      email: input.email,
      branch_id: input.branchId,
      department_id: input.departmentId,
      position_id: input.positionId,
      grade_id: input.gradeId,
      employment_type: input.employmentType,
      hire_date: input.hireDate,
      manager_employee_id: input.managerEmployeeId || null,
      mentor_employee_id: input.mentorEmployeeId || null,
      status: input.status,
    })
    .select("id")
    .single();

  if (error) throw error;

  // employee_profiles / career_goals の初期レコードも作っておくと後が楽
  const { error: profileErr } = await supabase.from("employee_profiles").insert({
    employee_id: data.id,
    career_summary: null,
    strengths: null,
    current_issues: null,
    notes_hr: null,
  });

  if (profileErr) throw profileErr;

  const { error: goalErr } = await supabase.from("employee_career_goals").insert({
    employee_id: data.id,
    goal_1y: null,
    goal_3y: null,
    desired_role: null,
    desired_career_path: null,
    reskilling_interest: null,
    mobility_preference: null,
    self_comment: null,
  });

  if (goalErr) throw goalErr;

  // 年間テンプレート適用
  if (input.templateId) {
    await applyAnnualTemplateToEmployee({
      employeeId: data.id,
      hireDate: input.hireDate,
      templateId: input.templateId,
      managerEmployeeId: input.managerEmployeeId || null,
      mentorEmployeeId: input.mentorEmployeeId || null,
      hrEmployeeId: input.hrEmployeeId || null,
    });
  }
  return { id: data.id };
}

export async function updateEmployee({
  me,
  employeeId,
  input,
}: {
  me: Me;
  employeeId: string;
  input: {
    employeeCode?: string;
    name?: string;
    email?: string;
    branchId?: string;
    departmentId?: string;
    positionId?: string;
    gradeId?: string;
    employmentType?: string;
    hireDate?: string;
    managerEmployeeId?: string;
    mentorEmployeeId?: string;
    status?: string;
  };
}) {
  const supabase = createSupabaseServerClient();

  const patch: Record<string, any> = {};

  if (input.employeeCode !== undefined) patch.employee_code = input.employeeCode;
  if (input.name !== undefined) patch.name = input.name;
  if (input.email !== undefined) patch.email = input.email;
  if (input.branchId !== undefined) patch.branch_id = input.branchId;
  if (input.departmentId !== undefined) patch.department_id = input.departmentId;
  if (input.positionId !== undefined) patch.position_id = input.positionId;
  if (input.gradeId !== undefined) patch.grade_id = input.gradeId;
  if (input.employmentType !== undefined) patch.employment_type = input.employmentType;
  if (input.hireDate !== undefined) patch.hire_date = input.hireDate;
  if (input.managerEmployeeId !== undefined) patch.manager_employee_id = input.managerEmployeeId || null;
  if (input.mentorEmployeeId !== undefined) patch.mentor_employee_id = input.mentorEmployeeId || null;
  if (input.status !== undefined) patch.status = input.status;

  const { error } = await supabase
    .from("employees")
    .update(patch)
    .eq("id", employeeId);

  if (error) throw error;

  return { id: employeeId };
}