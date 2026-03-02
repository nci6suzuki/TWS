// src/lib/auth/require-auth.ts
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Me, Role } from "@/types/api";

export async function requireAuth(): Promise<Me> {
  const supabase = createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  // 例：user_metadataに role/employeeId を入れておく設計（おすすめ）
  const role = (user.user_metadata?.role as Role | undefined) ?? "employee";
  const employeeId = (user.user_metadata?.employeeId as string | undefined);
  if (!employeeId) {
    // employeeIdがない状態は運用上まずいので、ログイン不可扱いもアリ
    redirect("/unauthorized");
  }

  // scopeは最初は空でOK。後でDBから埋める（支店・部署など）
  return {
    userId: user.id,
    employeeId,
    role,
    scope: user.user_metadata?.scope ?? undefined,
  };
}