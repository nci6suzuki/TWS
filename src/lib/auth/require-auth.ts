import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server"; // Auth API用（cookie）
import { createSupabaseServerDbClient } from "@/lib/supabase/server-db"; // DB/RLS用（Bearer）

export async function requireAuth() {
  // ① Authユーザー取得（ここはcookieでOK）
  const authClient = await createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) redirect("/login");

  // ② DBはBearer付きクライアントで叩く（auth.uid() が生きる）
  const db = createSupabaseServerDbClient();

  const { data: emp, error } = await db
    .from("employees")
    .select("id, app_role, employee_code")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) redirect("/unauthorized");
  if (!emp?.id) redirect("/unauthorized");

  return { userId: user.id, employeeId: emp.id, role: emp.app_role, employeeCode: emp.employee_code } as any;
}