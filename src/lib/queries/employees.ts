// src/lib/queries/employees.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Me } from "@/types/api";
import { canViewEmployee } from "@/lib/permissions/can";

type GetEmployeesInput = {
  me: Me;
  branchId?: string;
  departmentId?: string;
  positionId?: string;
  gradeId?: string;
  keyword?: string;
  page: number;
  limit: number;
  sort?: string;
  order?: "asc" | "desc";
};

export async function getEmployees(input: GetEmployeesInput) {
  const supabase = await createSupabaseServerClient();

  const page = Math.max(1, input.page);
  const limit = Math.min(Math.max(1, input.limit), 100);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let q = supabase
    .from("employees")
    .select(
      `
      id,
      user_id,
      employee_code,
      name,
      email,
      last_invited_at,
      invited_by_employee_id,
      inviter:invited_by_employee_id ( name ),
      status,
      branch_id,
      department_id,
      position_id,
      grade_id,
      manager_employee_id,
      branches:branch_id ( name ),
      departments:department_id ( name ),
      positions:position_id ( name ),
      grades:grade_id ( name )
      `,
      { count: "exact" }
    );

  // 画面フィルタ
  if (input.branchId) q = q.eq("branch_id", input.branchId);
  if (input.departmentId) q = q.eq("department_id", input.departmentId);
  if (input.positionId) q = q.eq("position_id", input.positionId);
  if (input.gradeId) q = q.eq("grade_id", input.gradeId);

  if (input.keyword) {
    q = q.or(`name.ilike.%${input.keyword}%,employee_code.ilike.%${input.keyword}%`);
  }

  // ロール別絞り込み（await の前に適用）
  if (input.me.role === "employee") {
    q = q.eq("id", input.me.employeeId);
  }

  if (input.me.role === "mentor" && input.me.scope?.employeeIds?.length) {
    q = q.in("id", input.me.scope.employeeIds);
  }

  if (input.me.role === "manager") {
    if (input.me.scope?.departmentIds?.length) {
      q = q.in("department_id", input.me.scope.departmentIds);
    } else if (input.me.scope?.branchIds?.length) {
      q = q.in("branch_id", input.me.scope.branchIds);
    }
  }

  // ソート
  const sortColumn = (input.sort ?? "name") as "name" | "employee_code" | "status";
  q = q.order(sortColumn, { ascending: (input.order ?? "asc") === "asc" });

  // ページング
  q = q.range(from, to);

  const { data, error, count } = await q;
  if (error) throw error;

  const filtered = (data ?? []).filter((row: any) =>
    canViewEmployee(input.me, row.id, row.department_id ?? undefined, row.branch_id ?? undefined)
  );

  return {
    items: filtered.map((row: any) => ({
      id: row.id,
      userId: row.user_id ?? null,
      employeeCode: row.employee_code,
      name: row.name,
      email: row.email ?? null,
      lastInvitedAt: row.last_invited_at ?? null,
      invitedByName: row.inviter?.[0]?.name ?? null,

      branchName: row.branches?.[0]?.name ?? "",
      departmentName: row.departments?.[0]?.name ?? "",
      positionName: row.positions?.[0]?.name ?? "",
      gradeName: row.grades?.[0]?.name ?? "",

      managerName: "",
      nextInterviewDate: null,
      followupStatus: "normal" as const,
      qualificationDueOn: null,
      status: (row.status ?? "active") as "active" | "inactive" | "leave",
    })),
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
    },
  };
}

export async function getEmployeeById(input: { me: Me; employeeId: string }) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("employees")
    .select(
      `
      id,
      employee_code,
      name,
      status,
      hire_date,
      branch_id,
      department_id,
      position_id,
      grade_id,
      manager_employee_id,
      mentor_employee_id,
      branches:branch_id ( name ),
      departments:department_id ( name ),
      positions:position_id ( name ),
      grades:grade_id ( name )
    `
    )
    .eq("id", input.employeeId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const ok = canViewEmployee(input.me, data.id, data.department_id ?? undefined, data.branch_id ?? undefined);
  if (!ok) return null;

  return {
    summary: {
      id: data.id,
      employeeCode: data.employee_code,
      name: data.name,
      branchName: data.branches?.[0]?.name ?? "",
      departmentName: data.departments?.[0]?.name ?? "",
      positionName: data.positions?.[0]?.name ?? "",
      gradeName: data.grades?.[0]?.name ?? "",
      hireDate: data.hire_date ?? null,
      managerEmployeeId: data.manager_employee_id ?? null,
      mentorEmployeeId: data.mentor_employee_id ?? null,
      nextInterviewDate: null,
      qualificationDueOn: null,
      alerts: [],
    },
  };
}

export async function getEmployeeEditData(input: { me: Me; employeeId: string }) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("employees")
    .select(`
      id,
      employee_code,
      name,
      email,
      branch_id,
      department_id,
      position_id,
      grade_id,
      employment_type,
      hire_date,
      manager_employee_id,
      mentor_employee_id,
      status
    `)
    .eq("id", input.employeeId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const ok = canViewEmployee(
    input.me,
    data.id,
    data.department_id ?? undefined,
    data.branch_id ?? undefined
  );
  if (!ok) return null;

  return {
    id: data.id,
    employeeCode: data.employee_code ?? "",
    name: data.name ?? "",
    email: data.email ?? "",
    branchId: data.branch_id ?? "",
    departmentId: data.department_id ?? "",
    positionId: data.position_id ?? "",
    gradeId: data.grade_id ?? "",
    employmentType: data.employment_type ?? "full_time",
    hireDate: data.hire_date ?? "",
    managerEmployeeId: data.manager_employee_id ?? "",
    mentorEmployeeId: data.mentor_employee_id ?? "",
    status: data.status ?? "active",
  };
}