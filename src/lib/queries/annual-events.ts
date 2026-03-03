// src/lib/queries/annual-events.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Me } from "@/types/api";

export async function getAnnualEvents({
  me,
  employeeId,
  fiscalYear,
  eventType,
  status,
  keyword,
  page,
  limit,
}: {
  me: Me;
  employeeId?: string;
  fiscalYear?: number;
  eventType?: string;
  status?: string;
  keyword?: string;
  page: number;
  limit: number;
}) {
  const supabase = createSupabaseServerClient();

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let q = supabase
    .from("employee_annual_events")
    .select(
      `
      id,
      employee_id,
      title,
      event_type,
      scheduled_date,
      status,
      priority,
      owner_employee_id,
      description,
      employees:employee_id ( id, name ),
      owners:owner_employee_id ( id, name )
    `,
      { count: "exact" }
    );

  if (employeeId) q = q.eq("employee_id", employeeId);
  if (eventType) q = q.eq("event_type", eventType);
  if (status) q = q.eq("status", status);

  if (fiscalYear) {
    const start = `${fiscalYear}-04-01`;
    const end = `${fiscalYear + 1}-03-31`;
    q = q.gte("scheduled_date", start).lte("scheduled_date", end);
  }

  q = q.order("scheduled_date", { ascending: true }).range(from, to);

  const { data, error, count } = await q;
  if (error) throw error;

  let items = (data ?? []).map((row: any) => ({
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employees?.name ?? "",
    title: row.title,
    eventType: row.event_type,
    scheduledDate: row.scheduled_date,
    status: row.status,
    priority: row.priority,
    ownerEmployeeId: row.owner_employee_id,
    ownerName: row.owners?.name ?? "",
    description: row.description ?? "",
  }));

  if (keyword) {
    const lower = keyword.toLowerCase();
    items = items.filter(
      (item) =>
        item.employeeName.toLowerCase().includes(lower) ||
        item.title.toLowerCase().includes(lower)
    );
  }

  return {
    items,
    pagination: {
      page,
      limit,
      total: count ?? items.length,
      totalPages: Math.max(1, Math.ceil((count ?? items.length) / limit)),
    },
  };
}

export async function getAnnualEventById({
  me,
  id,
}: {
  me: Me;
  id: string;
}) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
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
      description,
      employees:employee_id ( id, name ),
      owners:owner_employee_id ( id, name )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    employeeId: data.employee_id,
    employeeName: data.employees?.name ?? "",
    title: data.title,
    eventType: data.event_type,
    scheduledDate: data.scheduled_date,
    status: data.status,
    priority: data.priority,
    ownerEmployeeId: data.owner_employee_id,
    ownerName: data.owners?.name ?? "",
    description: data.description ?? "",
  };
}