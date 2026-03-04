// src/lib/auth/require-auth.ts
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Me, Role } from "@/types/api";
import { NextResponse } from "next/server";

export async function requireAuth(): Promise<Me> {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) redirect("/login");

  const role = (user.user_metadata?.role as Role | undefined) ?? "employee";
  const employeeId = user.user_metadata?.employeeId as string | undefined;

  if (!employeeId) redirect("/unauthorized");

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

export async function requireAuthApi(): Promise<
  | { ok: true; me: Me }
  | { ok: false; response: NextResponse }
> {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  const role = (user.user_metadata?.role as Role | undefined) ?? "employee";
  const employeeId = user.user_metadata?.employeeId as string | undefined;

  if (!employeeId) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      ),
    };
  }

  const scope = await buildScope({
    supabase,
    role,
    employeeId,
  });

  return {
    ok: true,
    me: {
      userId: user.id,
      employeeId,
      role,
      scope,
    },
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

  // 自分の所属取得
  const { data: meRow, error } = await supabase
    .from("employees")
    .select("id, branch_id, department_id")
    .eq("id", employeeId)
    .maybeSingle();

  if (error || !meRow) {
    return {};
  }

  // employee は自分のみ
  if (role === "employee") {
    return {
      employeeIds: [employeeId],
    };
  }

  // manager は同一部署 or 支店
  if (role === "manager") {
    return {
      branchIds: meRow.branch_id ? [meRow.branch_id] : [],
      departmentIds: meRow.department_id ? [meRow.department_id] : [],
    };
  }

  // mentor は担当社員のみ
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