import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServerDbClient } from "@/lib/supabase/server-db";

export type CurrentUser = {
  userId: string;
  employeeId: string;
  role: "admin" | "hr" | "manager" | "mentor" | "employee";
  employeeCode: string | null;
};

export async function requireAuth(): Promise<CurrentUser> {
  const authClient = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const db = await createSupabaseServerDbClient();

  const { data: emp, error: employeeError } = await db
    .from("employees")
    .select("id, app_role, employee_code")
    .eq("user_id", user.id)
    .maybeSingle();

  if (employeeError) {
    console.error("requireAuth employee error:", employeeError);
    redirect("/unauthorized");
  }

  if (!emp?.id) {
    redirect("/unauthorized");
  }

  return {
    userId: user.id,
    employeeId: emp.id,
    role: emp.app_role,
    employeeCode: emp.employee_code,
  };
}