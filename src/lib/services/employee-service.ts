// src/lib/services/employee-service.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { applyAnnualTemplateToEmployee } from "@/lib/services/template-service";
import { createEmployeeSchema, type CreateEmployeeInput } from "@/lib/validations/employee";

export async function createEmployee({
  input,
}: {
  input: CreateEmployeeInput;
}) {
  const supabase = await createSupabaseServerClient();
  const parsedInput = await validateCreateEmployeeInput(input);
  let createdEmployeeId: string | null = null;

  const { data, error } = await supabase
    .from("employees")
    .insert({
      employee_code: parsedInput.employeeCode,
      name: parsedInput.name,
      email: parsedInput.email,
      branch_id: parsedInput.branchId,
      department_id: parsedInput.departmentId,
      position_id: parsedInput.positionId,
      grade_id: parsedInput.gradeId,
      employment_type: parsedInput.employmentType,
      hire_date: parsedInput.hireDate,
      manager_employee_id: parsedInput.managerEmployeeId || null,
      mentor_employee_id: parsedInput.mentorEmployeeId || null,
      status: parsedInput.status,
    })
    .select("id")
    .single();

  if (error) throw toUserSafeError(error);

  createdEmployeeId = data.id;

  try {
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

    if (parsedInput.templateId) {
      await applyAnnualTemplateToEmployee({
        employeeId: data.id,
        hireDate: parsedInput.hireDate,
        templateId: parsedInput.templateId,
        managerEmployeeId: parsedInput.managerEmployeeId || null,
        mentorEmployeeId: parsedInput.mentorEmployeeId || null,
        hrEmployeeId: parsedInput.hrEmployeeId || null,
      });
    }

    return { id: data.id };
  } catch (error) {
    if (createdEmployeeId) {
      await rollbackEmployeeCreation({
        supabase,
        employeeId: createdEmployeeId,
      });
    }

    throw toUserSafeError(error);
  }
}

async function validateCreateEmployeeInput(input: CreateEmployeeInput) {
  const parsedInput = createEmployeeSchema.parse(input);
  const supabase = await createSupabaseServerClient();

  const [existingEmployeeCode, existingEmail, branch, department, position, grade, manager, mentor, template] =
    await Promise.all([
      supabase.from("employees").select("id").eq("employee_code", parsedInput.employeeCode).maybeSingle(),
      supabase.from("employees").select("id").eq("email", parsedInput.email).maybeSingle(),
      supabase.from("branches").select("id").eq("id", parsedInput.branchId).maybeSingle(),
      supabase.from("departments").select("id, branch_id").eq("id", parsedInput.departmentId).maybeSingle(),
      supabase.from("positions").select("id").eq("id", parsedInput.positionId).maybeSingle(),
      supabase.from("grades").select("id").eq("id", parsedInput.gradeId).maybeSingle(),
      parsedInput.managerEmployeeId
        ? supabase.from("employees").select("id").eq("id", parsedInput.managerEmployeeId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      parsedInput.mentorEmployeeId
        ? supabase.from("employees").select("id").eq("id", parsedInput.mentorEmployeeId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      parsedInput.templateId
        ? supabase.from("annual_plan_templates").select("id").eq("id", parsedInput.templateId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

  if (existingEmployeeCode.error) throw existingEmployeeCode.error;
  if (existingEmployeeCode.data) throw new Error("この社員番号は既に登録されています");

  if (existingEmail.error) throw existingEmail.error;
  if (existingEmail.data) throw new Error("このメールアドレスは既に登録されています");

  if (branch.error) throw branch.error;
  if (!branch.data) throw new Error("指定された支店が見つかりません");

  if (department.error) throw department.error;
  if (!department.data) throw new Error("指定された部署が見つかりません");
  if (department.data.branch_id !== parsedInput.branchId) {
    throw new Error("選択した部署は指定された支店に属していません");
  }

  if (position.error) throw position.error;
  if (!position.data) throw new Error("指定された役職が見つかりません");

  if (grade.error) throw grade.error;
  if (!grade.data) throw new Error("指定された等級が見つかりません");

  if (manager.error) throw manager.error;
  if (parsedInput.managerEmployeeId && !manager.data) {
    throw new Error("指定された直属上長が見つかりません");
  }

  if (mentor.error) throw mentor.error;
  if (parsedInput.mentorEmployeeId && !mentor.data) {
    throw new Error("指定されたメンターが見つかりません");
  }

  if (template.error) throw template.error;
  if (parsedInput.templateId && !template.data) {
    throw new Error("指定された年間イベントテンプレートが見つかりません");
  }

  return parsedInput;
}

async function rollbackEmployeeCreation({
  supabase,
  employeeId,
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  employeeId: string;
}) {
  const cleanupTargets = [
    supabase.from("employee_annual_events").delete().eq("employee_id", employeeId),
    supabase.from("employee_career_goals").delete().eq("employee_id", employeeId),
    supabase.from("employee_profiles").delete().eq("employee_id", employeeId),
    supabase.from("employees").delete().eq("id", employeeId),
  ];

  const results = await Promise.allSettled(cleanupTargets);

  for (const result of results) {
    if (result.status === "fulfilled" && result.value.error) {
      console.error("rollbackEmployeeCreation error:", result.value.error);
    } else if (result.status === "rejected") {
      console.error("rollbackEmployeeCreation exception:", result.reason);
    }
  }
}

function toUserSafeError(error: unknown) {
  if (error instanceof Error && error.message) return error;

  const code = (error as { code?: string } | null)?.code;
  const message = (error as { message?: string } | null)?.message;

  if (code === "23505") {
    return new Error("社員番号またはメールアドレスが既に登録されています");
  }

  if (code === "23503") {
    return new Error("関連するマスタデータが見つかりません");
  }

  return new Error(message ?? "登録に失敗しました");
}

export async function updateEmployee({
  employeeId,
  input,
}: {
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
  const supabase = await createSupabaseServerClient();

  const patch: Record<string, unknown> = {};

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

  const { error } = await supabase.from("employees").update(patch).eq("id", employeeId);

  if (error) throw error;

  return { id: employeeId };
}