import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireAuth() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // employees ひも付け（RLSで見える前提）
  const { data: emp } = await supabase
    .from("employees")
    .select("id, app_role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!emp?.id) redirect("/unauthorized");

  return { userId: user.id, employeeId: emp.id, role: emp.app_role } as any;
}