// src/app/api/templates/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/auth/require-auth-api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuthApi();
    const { id } = await params;

    const supabase = await createSupabaseServerClient();
    const body = await req.json();

    const { error: templateErr } = await supabase
      .from("annual_plan_templates")
      .update({
        name: body.name,
        target_job_type: body.targetJobType || null,
        target_grade: body.targetGrade || null,
        is_active: body.isActive,
      })
      .eq("id", id);

    if (templateErr) throw templateErr;

    const { error: deleteErr } = await supabase
      .from("annual_plan_template_events")
      .delete()
      .eq("template_id", id);

    if (deleteErr) throw deleteErr;

    if ((body.events ?? []).length > 0) {
      const rows = body.events.map((event: any) => ({
        template_id: id,
        event_type: event.eventType,
        title: event.title,
        offset_days_from_hire: event.offsetDaysFromHire,
        default_owner_type: event.defaultOwnerType,
        priority: event.priority,
        description: event.description || null,
      }));

      const { error: insertErr } = await supabase
        .from("annual_plan_template_events")
        .insert(rows);

      if (insertErr) throw insertErr;
    }

    return NextResponse.json({ success: true, data: { id } });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: { code: "ERROR", message: e?.message ?? "更新に失敗しました" } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuthApi();
    const { id } = await params;

    const supabase = await createSupabaseServerClient();

    // 子テーブルを先に削除
    const { error: childErr } = await supabase
      .from("annual_plan_template_events")
      .delete()
      .eq("template_id", id);

    if (childErr) throw childErr;

    const { error: parentErr } = await supabase
      .from("annual_plan_templates")
      .delete()
      .eq("id", id);

    if (parentErr) throw parentErr;

    return NextResponse.json({ success: true, data: { id } });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: { code: "ERROR", message: e?.message ?? "削除に失敗しました" } },
      { status: 500 }
    );
  }
}