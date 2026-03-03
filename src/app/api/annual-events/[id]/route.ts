// src/app/api/annual-events/[id]/route.ts
import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/auth/require-auth-api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuthApi();
    const supabase = createSupabaseServerClient();
    const body = await req.json();

    const { error } = await supabase
      .from("employee_annual_events")
      .update({
        employee_id: body.employeeId,
        title: body.title,
        event_type: body.eventType,
        scheduled_date: body.scheduledDate,
        owner_employee_id: body.ownerEmployeeId,
        priority: body.priority,
        status: body.status,
        description: body.description ?? null,
      })
      .eq("id", params.id);

    if (error) throw error;

    return NextResponse.json({ success: true, data: { id: params.id } });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: { code: "ERROR", message: e?.message ?? "更新に失敗しました" } },
      { status: 500 }
    );
  }
}