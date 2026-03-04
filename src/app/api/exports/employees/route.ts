import { requireAuthApi } from "@/lib/auth/require-auth-api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  await requireAuthApi();
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("employees")
    .select(`
      employee_code,
      name,
      email,
      app_role,
      employment_type,
      hire_date,
      status
    `)
    .csv();

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return new Response(data, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="employees.csv"`,
    },
  });
}