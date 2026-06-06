// src/lib/queries/employees.ts
import { createSupabaseServerDbClient } from "@/lib/supabase/server-db";

export async function getEmployeeIdByCode(employeeCode: string) {
  const supabase = await createSupabaseServerDbClient();

  const { data, error } = await supabase
    .from("employees")
    .select("id")
    .eq("employee_code", employeeCode)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}