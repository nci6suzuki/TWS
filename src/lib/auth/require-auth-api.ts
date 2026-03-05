// src/lib/auth/require-auth-api.ts
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Me, Role } from "@/types/api";

export async function requireAuthApi(): Promise<Me> {
  const supabase = createSupabaseServerClient();

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("tm-access-token")?.value;

  if (!accessToken) throw new Error("UNAUTHORIZED");

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) throw new Error("UNAUTHORIZED");

  const role = (user.user_metadata?.role as Role | undefined) ?? "employee";
  const employeeId = user.user_metadata?.employeeId as string | undefined;

  if (!employeeId) throw new Error("UNAUTHORIZED");

  const scope = await buildScope({
    supabase,
    role,
    employeeId,
  });

  return {
    userId: user.id,
    employeeId,
    role,
    scope,
  };
}

async function buildScope({
  supabase,
  role,
  employeeId,
}: {
  supabase: ReturnType<typeof createSupabaseServerClient>;
  role: Role;
  employeeId: string;
}) {
  if (role === "admin" || role === "hr") {
    return {};
  }

  const { data: meRow, error } = await supabase
    .from("employees")
    .select("id, branch_id, department_id")
    .eq("id", employeeId)
    .maybeSingle();

  if (error || !meRow) {
    return {};
  }

  if (role === "employee") {
    return {
      employeeIds: [employeeId],
    };
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

    return {
      employeeIds: [employeeId, ...(mentees ?? []).map((x: any) => x.id)],
    };
  }

  return {};
}