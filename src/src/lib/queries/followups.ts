// src/lib/queries/followups.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Me } from "@/types/api";

type GetFollowupsInput = {
  me: Me;
  fiscalYear?: number;
  quarter?: 1 | 2 | 3 | 4;
  status?: string;
  assigneeEmployeeId?: string;
  employeeId?: string;
  branchId?: string;
  page: number;
  limit: number;
};

export async function getFollowups(input: GetFollowupsInput) {
  const supabase = createSupabaseServerClient();

  const page = Math.max(1, input.page);
  const limit = Math.min(Math.max(1, input.limit), 100);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let q = supabase
    .from("followup_assignments")
    .select(
      `
      id,
      fiscal_year,
      quarter,
      followup_type,
      due_date,
      status,
      priority,
      note,
      employee_id,
      assignee_employee_id,
      employees:employee_id ( id, name, branch_id, branches:branch_id ( name ) ),
      assignee:assignee_employee_id ( id, name )
    `,
      { count: "exact" }
    );

  if (input.fiscalYear) q = q.eq("fiscal_year", input.fiscalYear);
  if (input.quarter) q = q.eq("quarter", input.quarter);
  if (input.status) q = q.eq("status", input.status);
  if (input.assigneeEmployeeId) q = q.eq("assignee_employee_id", input.assigneeEmployeeId);
  if (input.employeeId) q = q.eq("employee_id", input.employeeId);
  if (input.branchId) q = q.eq("employees.branch_id", input.branchId);
  
  // getFollowups の query 部分に追加
  if (input.me.role === "employee") {
    q = q.eq("employee_id", input.me.employeeId);
  }
  
  if (input.me.role === "mentor" && input.me.scope?.employeeIds?.length) {
    q = q.in("employee_id", input.me.scope.employeeIds);
  }
  
  if (input.me.role === "manager") {
  // manager は自分担当分だけにするなら assignee_employee_id = 自分
  // 部署全体を見るなら employee_id ベースで scope 取得が必要
  q = q.eq("assignee_employee_id", input.me.employeeId);
}

  // 標準は期限が近い順
  q = q.order("due_date", { ascending: true }).range(from, to);

  const { data, error, count } = await q;
  if (error) throw error;

  return {
    items: (data ?? []).map((row: any) => ({
      id: row.id,
      fiscalYear: row.fiscal_year,
      quarter: row.quarter,
      employeeId: row.employee_id,
      employeeName: row.employees?.name ?? "",
      branchName: row.employees?.branches?.name ?? "",
      followupType: row.followup_type,
      assigneeEmployeeId: row.assignee_employee_id,
      assigneeName: row.assignee?.name ?? "",
      dueDate: row.due_date,
      status: row.status,
      priority: row.priority ?? 2,
      lastInterviewDate: null, // 将来：interview_recordsの最新で埋める
    })),
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
    },
  };
}

export async function getFollowupById(input: { me: Me; id: string }) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("followup_assignments")
    .select(
      `
      id,
      fiscal_year,
      quarter,
      followup_type,
      due_date,
      status,
      priority,
      note,
      employee_id,
      assignee_employee_id,
      employees:employee_id ( id, name, branch_id, department_id ),
      assignee:assignee_employee_id ( id, name )
    `
    )
    .eq("id", input.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  // ここで scope 権限チェックを強化する（今は簡易にHR/admin/担当者のみ等）
  // 例：担当者 or HR/admin だけ見れる、など。
  const isAssignee = input.me.employeeId === data.assignee_employee_id;
  const isHrAdmin = input.me.role === "admin" || input.me.role === "hr";
  if (!isAssignee && !isHrAdmin) return null;

  return {
    id: data.id,
    fiscalYear: data.fiscal_year,
    quarter: data.quarter,
    employeeId: data.employee_id,
    employeeName: data.employees?.name ?? "",
    branchName: "", // 必要ならjoin
    followupType: data.followup_type,
    assigneeEmployeeId: data.assignee_employee_id,
    assigneeName: data.assignee?.name ?? "",
    dueDate: data.due_date,
    status: data.status,
    priority: data.priority ?? 2,
    note: data.note ?? null,
  };
}