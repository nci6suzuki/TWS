// src/lib/activity-logs/create-activity-log.ts

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type CreateActivityLogInput = {
  employeeId: string;
  actorEmployeeId?: string | null;
  activityType: string;
  title: string;
  description?: string | null;
  relatedType?: string | null;
  relatedId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function createActivityLog(input: CreateActivityLogInput) {
  const admin = createSupabaseAdminClient();

  const { error } = await admin.from("employee_activity_logs").insert({
    employee_id: input.employeeId,
    actor_employee_id: input.actorEmployeeId ?? null,
    activity_type: input.activityType,
    title: input.title,
    description: input.description ?? null,
    related_type: input.relatedType ?? null,
    related_id: input.relatedId ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) {
    console.error("createActivityLog error:", error.message);
  }
}