// src/lib/queries/annual-events.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Me } from "@/types/api";

export async function getAnnualEvents({
  me,
  employeeId,
  fiscalYear,
  page,
  limit,
}: {
  me: Me;
  employeeId?: string;
  fiscalYear?: number;
  page: number;
  limit: number;
}) {
  const supabase = createSupabaseServerClient();

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let q = supabase
    .from("employee_annual_events")
    .select(`
      id,
      employee_id,
      title,
      event_type,
      scheduled_date,
      status,
      priority,
      owner_employee_id,
      employees:employee_id ( id, name ),
      owners:owner_employee_id ( id, name )
    `, { count: "exact" });

  if (employeeId) q = q.eq("employee_id", employeeId);

  if (fiscalYear) {
    const start = `${fiscalYear}-04-01`;
    const end = `${fiscalYear + 1}-03-31`;
    q = q.gte("scheduled_date", start).lte("scheduled_date", end);
  }

  q = q.order("scheduled_date", { ascending: true }).range(from, to);

  const { data, error, count } = await q;
  if (error) throw error;

  return {
    items: (data ?? []).map((row: any) => ({
      id: row.id,
      employeeId: row.employee_id,
      employeeName: row.employees?.name ?? "",
      title: row.title,
      eventType: row.event_type,
      scheduledDate: row.scheduled_date,
      status: row.status,
      priority: row.priority,
      ownerName: row.owners?.name ?? "",
    })),
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
    },
  };
}