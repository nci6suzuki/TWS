import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Me } from "@/types/api";

export async function getTemplates({
  me,
}: {
  me: Me;
}) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("annual_plan_templates")
    .select(`
      id,
      name,
      target_job_type,
      target_grade,
      is_active
    `)
    .order("name", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    targetJobType: row.target_job_type ?? "",
    targetGrade: row.target_grade ?? "",
    isActive: row.is_active ?? true,
  }));
}

export async function getTemplateById({
  me,
  id,
}: {
  me: Me;
  id: string;
}) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("annual_plan_templates")
    .select(`
      id,
      name,
      target_job_type,
      target_grade,
      is_active,
      annual_plan_template_events (
        id,
        event_type,
        title,
        offset_days_from_hire,
        default_owner_type,
        priority,
        description
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    targetJobType: data.target_job_type ?? "",
    targetGrade: data.target_grade ?? "",
    isActive: data.is_active ?? true,
    events: (data.annual_plan_template_events ?? []).map((e: any) => ({
      id: e.id,
      eventType: e.event_type,
      title: e.title,
      offsetDaysFromHire: e.offset_days_from_hire,
      defaultOwnerType: e.default_owner_type,
      priority: e.priority,
      description: e.description ?? "",
    })),
  };
}