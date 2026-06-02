// src/lib/auth/require-auth-api.ts
import { createSupabaseServerAuthClient } from "@/lib/supabase/server-auth";
import type { Me } from "@/types/api";

export async function requireAuthApi(): Promise<Me> {
  const supabase = await createSupabaseServerAuthClient();

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("UNAUTHORIZED");

  const { data: emp } = await supabase
    .from("employees")
    .select("id, app_role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!emp?.id) throw new Error("UNAUTHORIZED");

  return { userId: user.id, employeeId: emp.id, role: emp.app_role, scope: {} } as any;
}