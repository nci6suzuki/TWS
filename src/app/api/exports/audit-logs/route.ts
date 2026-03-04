import { requireAuthApi } from "@/lib/auth/require-auth-api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const me = await requireAuthApi();
  if (!["admin", "hr"].includes(me.role)) {
    return new Response("FORBIDDEN", { status: 403 });
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("audit_logs")
    .select(`
      id,
      table_name,
      action,
      record_id,
      actor_employee_id,
      created_at
    `)
    .csv();

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return new Response(data, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="audit_logs.csv"`,
    },
  });
}