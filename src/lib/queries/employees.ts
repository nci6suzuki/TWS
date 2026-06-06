// src/lib/queries/employees.ts
import { createSupabaseServerDbClient } from "@/lib/supabase/server-db";

export async function getEmployeeIdByCode(employeeCode: string) {
  const supabase = await createSupabaseServerDbClient();

  // URL/入力の揺れ対策
  const code = decodeURIComponent(employeeCode).trim();

  // ① まず完全一致
  const { data: exact, error: exactErr } = await supabase
    .from("employees")
    .select("id, employee_code")
    .eq("employee_code", code)
    .maybeSingle();

  if (exactErr) throw exactErr;
  if (exact?.id) return exact.id;

  // ② 次に大文字小文字を無視（ilikeはcase-insensitive）
  const { data: ci, error: ciErr } = await supabase
    .from("employees")
    .select("id, employee_code")
    .ilike("employee_code", code)
    .maybeSingle();

  if (ciErr) throw ciErr;

  return ci?.id ?? null;
}