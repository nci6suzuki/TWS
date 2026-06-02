// src/lib/auth/require-auth-api.ts
import { Me, Role } from "@/types/api";
import { createSupabaseServerAuthClient } from "@/lib/supabase/server-auth";

type Supabase = Awaited<ReturnType<typeof createSupabaseServerAuthClient>>;
type EmployeeScopeRow = {
  id: string;
  app_role?: string | null;
  branch_id?: string | null;
  department_id?: string | null;
};

export async function requireAuthApi(req: Request): Promise<Me> {
  const supabase = await createSupabaseServerAuthClient(req);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) throw new Error("UNAUTHORIZED");

  // employees.user_id を正とする（user_metadata 依存を避ける）
  const { data: employeeRow, error: empErr } = await supabase
    .from("employees")
    .select("id, app_role, branch_id, department_id")
    .eq("user_id", user.id)
    .maybeSingle<EmployeeScopeRow>();

  if (empErr || !employeeRow?.id) throw new Error("UNAUTHORIZED");

  const role = normalizeRole(employeeRow.app_role ?? (user.user_metadata?.role as Role | undefined));
  if (!role) throw new Error("UNAUTHORIZED");

  const scope = await buildScope({
    supabase,
    role,
    employeeId: employeeRow.id,
    employeeRow,
  });

  return {
    userId: user.id,
    employeeId: employeeRow.id,
    role,
    scope,
  };
}

function normalizeRole(value?: string | null): Role | null {
  if (value === "admin" || value === "hr" || value === "manager" || value === "mentor" || value === "employee") {
    return value;
  }
  return null;
}

async function buildScope({
  supabase,
  role,
  employeeId,
  employeeRow,
}: {
  supabase: Supabase;
  role: Role;
  employeeId: string;
  employeeRow: EmployeeScopeRow;
}) {
  if (role === "admin" || role === "hr") return {};

  if (role === "employee") {
    return { employeeIds: [employeeId] };
  }

  if (role === "manager") {
    return {
      branchIds: employeeRow.branch_id ? [employeeRow.branch_id] : [],
      departmentIds: employeeRow.department_id ? [employeeRow.department_id] : [],
    };
  }

  if (role === "mentor") {
    const { data: mentees } = await supabase
      .from("employees")
      .select("id")
      .eq("mentor_employee_id", employeeId);

    return { employeeIds: [employeeId, ...(mentees ?? []).map((x: any) => x.id)] };
  }

  return {};
}