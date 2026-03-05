import { NextRequest, NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/auth/require-auth-api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    await requireAuthApi();
    const supabase = createSupabaseServerClient();
    const body = await req.json();

    const { data: template, error: templateErr } = await supabase
      .from("annual_plan_templates")
      .insert({
        name: body.name,
        target_job_type: body.targetJobType || null,
        target_grade: body.targetGrade || null,
        is_active: body.isActive,
      })
      .select("id")
      .single();

    if (templateErr) throw templateErr;

    if ((body.events ?? []).length > 0) {
      const rows = body.events.map((event: any) => ({
        template_id: template.id,
        event_type: event.eventType,
        title: event.title,
        offset_days_from_hire: event.offsetDaysFromHire,
        default_owner_type: event.defaultOwnerType,
        priority: event.priority,
        description: event.description || null,
      }));

      const { error: eventErr } = await supabase
        .from("annual_plan_template_events")
        .insert(rows);

      if (eventErr) throw eventErr;
    }

    return NextResponse.json({ success: true, data: { id: template.id } });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: { code: "ERROR", message: e?.message ?? "作成に失敗しました" } },
      { status: 500 }
    );
  }
}