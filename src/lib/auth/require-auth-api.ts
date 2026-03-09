import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Me, Role } from "@/types/api";

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export async function requireAuthApi(): Promise<Me> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  console.log("requireAuthApi error:", error);
  console.log("requireAuthApi user id:", user?.id);
  console.log("requireAuthApi metadata:", user?.user_metadata);

  if (error || !user) throw new Error("UNAUTHORIZED");

  const role = (user.user_metadata?.role as Role | undefined) ?? "employee";
  const employeeId =
    (user.user_metadata?.employeeId as string | undefined) ??
    (user.user_metadata?.employee_id as string | undefined);

  console.log("requireAuthApi role:", role);
  console.log("requireAuthApi employeeId:", employeeId);

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
  supabase: Supabase;
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

  console.log("buildScope meRow:", meRow);
  console.log("buildScope error:", error);

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