// src/lib/services/template-service.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function applyAnnualTemplateToEmployee({
  employeeId,
  hireDate,
  templateId,
  managerEmployeeId,
  mentorEmployeeId,
  hrEmployeeId,
}: {
  employeeId: string;
  hireDate: string;
  templateId: string;
  managerEmployeeId?: string | null;
  mentorEmployeeId?: string | null;
  hrEmployeeId?: string | null;
}) {
  const supabase = createSupabaseServerClient();

  const { data: templateEvents, error } = await supabase
    .from("annual_plan_template_events")
    .select(`
      id,
      event_type,
      title,
      offset_days_from_hire,
      default_owner_type,
      priority,
      description
    `)
    .eq("template_id", templateId)
    .order("offset_days_from_hire", { ascending: true });

  if (error) throw error;

  const hire = new Date(hireDate);

  const rows = (templateEvents ?? []).map((event: any) => {
    const scheduled = new Date(hire);
    scheduled.setDate(scheduled.getDate() + (event.offset_days_from_hire ?? 0));

    let ownerEmployeeId: string | null = null;
    if (event.default_owner_type === "manager") ownerEmployeeId = managerEmployeeId ?? null;
    if (event.default_owner_type === "mentor") ownerEmployeeId = mentorEmployeeId ?? null;
    if (event.default_owner_type === "hr") ownerEmployeeId = hrEmployeeId ?? null;

    return {
      employee_id: employeeId,
      title: event.title,
      event_type: event.event_type,
      scheduled_date: formatDate(scheduled),
      owner_employee_id: ownerEmployeeId,
      priority: event.priority ?? 2,
      status: "pending",
      description: event.description ?? null,
    };
  });

  if (rows.length === 0) return { createdCount: 0 };

  const { error: insertErr } = await supabase
    .from("employee_annual_events")
    .insert(rows);

  if (insertErr) throw insertErr;

  return { createdCount: rows.length };
}

function formatDate(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}