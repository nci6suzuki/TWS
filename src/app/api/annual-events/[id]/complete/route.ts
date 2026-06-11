import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await requireAuth();

    if (me.role !== "admin" && me.role !== "hr") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "権限がありません",
          },
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    const admin = createSupabaseAdminClient();

    const { data: event, error: eventFindError } = await admin
      .from("employee_annual_events")
      .select(
        "id, employee_id, title, event_type, status, source_type, source_id"
      )
      .eq("id", id)
      .maybeSingle();

    if (eventFindError) throw eventFindError;

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "年間イベントが見つかりません",
          },
        },
        { status: 404 }
      );
    }

    const completedAt = new Date().toISOString();

    const { error: eventUpdateError } = await admin
      .from("employee_annual_events")
      .update({
        status: "done",
        completed_at: completedAt,
      })
      .eq("id", id);

    if (eventUpdateError) throw eventUpdateError;

    /**
     * 面談履歴から自動作成されたイベントの場合、
     * 元の面談履歴にも「次回面談完了」を反映
     */
    if (event.source_type === "employee_interview" && event.source_id) {
      const { data: interview, error: interviewFindError } = await admin
        .from("employee_interviews")
        .select("id, action_items")
        .eq("id", event.source_id)
        .maybeSingle();

      if (interviewFindError) throw interviewFindError;

      if (interview) {
        const completedMemo = `\n\n[自動記録] 年間イベント「${event.title}」を完了しました。完了日時: ${completedAt}`;

        const nextActionItems = interview.action_items
          ? `${interview.action_items}${completedMemo}`
          : completedMemo.trim();

        const { error: interviewUpdateError } = await admin
          .from("employee_interviews")
          .update({
            next_interview_completed_at: completedAt,
            next_interview_completed_event_id: event.id,
            action_items: nextActionItems,
            updated_at: completedAt,
          })
          .eq("id", interview.id);

        if (interviewUpdateError) throw interviewUpdateError;
      }
    }

    const formData = await _req.formData().catch(() => null);
    const returnTo = String(formData?.get("returnTo") ?? "/annual-events");
    
    return NextResponse.redirect(new URL(returnTo, _req.url));
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "ERROR",
          message: e?.message ?? "完了化に失敗しました",
        },
      },
      { status: 500 }
    );
  }
}