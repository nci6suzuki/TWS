// src/app/api/annual-events/route.ts
import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/auth/require-auth-api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    await requireAuthApi();
    const supabase = await createSupabaseServerClient();
    const body = await req.json();

    const { data, error } = await supabase
      .from("employee_annual_events")
      .insert({
        employee_id: body.employeeId,
        title: body.title,
        event_type: body.eventType,
        scheduled_date: body.scheduledDate,
        owner_employee_id: body.ownerEmployeeId,
        priority: body.priority,
        status: body.status,
        description: body.description ?? null,
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: { id: data.id } });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: { code: "ERROR", message: e?.message ?? "登録に失敗しました" } },
      { status: 500 }
    );
  }
}