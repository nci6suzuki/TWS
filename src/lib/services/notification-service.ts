// src/lib/services/notification-service.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createNotification(input: {
  userEmployeeId: string;
  type: string;
  title: string;
  body?: string;
  relatedTable?: string;
  relatedId?: string;
}) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("notifications").insert({
    user_employee_id: input.userEmployeeId,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    related_table: input.relatedTable ?? null,
    related_id: input.relatedId ?? null,
    is_read: false,
  });

  if (error) throw error;
}