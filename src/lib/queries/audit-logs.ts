import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Me } from "@/types/api";

export async function getAuditLogs({
  me,
  tableName,
  action,
  page,
  limit,
}: {
  me: Me;
  tableName?: string;
  action?: "INSERT" | "UPDATE" | "DELETE";
  page: number;
  limit: number;
}) {
  if (!["admin", "hr"].includes(me.role)) {
    throw new Error("FORBIDDEN");
  }

  const supabase = createSupabaseServerClient();

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let q = supabase
    .from("audit_logs")
    .select(
      `
      id,
      table_name,
      action,
      record_id,
      actor_user_id,
      actor_employee_id,
      old_data,
      new_data,
      created_at,
      actor:actor_employee_id (
        id,
        name,
        employee_code
      )
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (tableName) q = q.eq("table_name", tableName);
  if (action) q = q.eq("action", action);

  const { data, error, count } = await q;
  if (error) throw error;

  return {
    items: (data ?? []).map((row: any) => ({
      id: row.id,
      tableName: row.table_name,
      action: row.action,
      recordId: row.record_id,
      actorEmployeeId: row.actor_employee_id,
      actorName: row.actor?.name ?? "",
      actorEmployeeCode: row.actor?.employee_code ?? "",
      oldData: row.old_data,
      newData: row.new_data,
      createdAt: row.created_at,
    })),
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
    },
  };
}