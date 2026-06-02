// src/lib/auth/require-auth.ts
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createSupabaseServerAuthClient } from "@/lib/supabase/server-auth";
import { Me, Role } from "@/types/api";

type Supabase = Awaited<ReturnType<typeof createSupabaseServerAuthClient>>;
type EmployeeScopeRow = {
  id: string;
  app_role?: string | null;
  branch_id?: string | null;
  department_id?: string | null;
};

export async function requireAuth(): Promise<Me> {
  const supabase = await createSupabaseServerAuthClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) redirect("/login");

  const authContext = await resolveAuthContext({
    supabase,
    userId: user.id,
    metadataRole: user.user_metadata?.role as Role | undefined,
    metadataEmployeeId:
      (user.user_metadata?.employeeId as string | undefined) ??
      (user.user_metadata?.employee_id as string | undefined),
  });

  if (!authContext) redirect("/unauthorized");

  const scope = await buildScope({
    supabase,
    role: authContext.role,
    employeeId: authContext.employeeId,
    employeeRow: authContext.employeeRow,
  });

  return {
    userId: user.id,
    employeeId: authContext.employeeId,
    role: authContext.role,
    scope,
  };
}

// API Route から使う簡易ヘルパー（既存の戻り値形式を維持）
export async function requireAuthApi(): Promise<
  | { ok: true; me: Me }
  | { ok: false; response: NextResponse }
> {
  const supabase = await createSupabaseServerAuthClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  const authContext = await resolveAuthContext({
    supabase,
    userId: user.id,
    metadataRole: user.user_metadata?.role as Role | undefined,
    metadataEmployeeId:
      (user.user_metadata?.employeeId as string | undefined) ??
      (user.user_metadata?.employee_id as string | undefined),
  });

  if (!authContext) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
    };
  }

  const scope = await buildScope({
    supabase,
    role: authContext.role,
    employeeId: authContext.employeeId,
    employeeRow: authContext.employeeRow,
  });

  return {
    ok: true,
    me: {
      userId: user.id,
      employeeId: authContext.employeeId,
      role: authContext.role,
      scope,
    },
  };
}

async function resolveAuthContext({
  supabase,
  userId,
  metadataRole,
  metadataEmployeeId,
}: {
  supabase: Supabase;
  userId: string;
  metadataRole?: Role;
  metadataEmployeeId?: string;
}) {
  const { data: employeeRow, error } = await supabase
    .from("employees")
    .select("id, app_role, branch_id, department_id")
    .eq("user_id", userId)
    .maybeSingle<EmployeeScopeRow>();

  if (error) return null;

  const role = normalizeRole(metadataRole ?? employeeRow?.app_role ?? undefined);
  // employees.id を正とする
  const employeeId = employeeRow?.id ?? metadataEmployeeId ?? null;

  if (!role || !employeeId) return null;

  return { role, employeeId, employeeRow };
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
  employeeRow?: EmployeeScopeRow | null;
}) {
  if (role === "admin" || role === "hr") return {};

  const meRow =
    employeeRow?.id === employeeId
      ? employeeRow
      : await fetchEmployeeScopeRow({ supabase, employeeId });

  if (!meRow) return {};

  if (role === "employee") {
    return { employeeIds: [employeeId] };
  }

  if (role === "manager") {
    return {
      branchIds: meRow.branch_id ? [meRow.branch_id] : [],
      departmentIds: meRow.department_id ? [meRow.department_id] : [],
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

async function fetchEmployeeScopeRow({
  supabase,
  employeeId,
}: {
  supabase: Supabase;
  employeeId: string;
}) {
  const { data, error } = await supabase
    .from("employees")
    .select("id, app_role, branch_id, department_id")
    .eq("id", employeeId)
    .maybeSingle<EmployeeScopeRow>();

  if (error || !data) return null;
  return data;
}