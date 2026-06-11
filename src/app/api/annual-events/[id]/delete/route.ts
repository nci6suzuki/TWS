import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const formData = await req.formData().catch(() => null);
    const returnTo = String(formData?.get("returnTo") ?? "/annual-events");

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

    const { data: event, error: findError } = await admin
      .from("employee_annual_events")
      .select("id, source_type, source_id")
      .eq("id", id)
      .maybeSingle();

    if (findError) throw findError;

    if (!event) {
      return NextResponse.redirect(new URL(returnTo, req.url));
    }

    /**
     * 面談履歴から自動作成されたイベントの場合、
     * 元の面談履歴側の次回面談予定を空にする
     */
    if (event.source_type === "employee_interview" && event.source_id) {
      const now = new Date().toISOString();

      const { error: interviewUpdateError } = await admin
        .from("employee_interviews")
        .update({
          next_interview_date: null,
          next_interview_completed_at: null,
          next_interview_completed_event_id: null,
          updated_at: now,
        })
        .eq("id", event.source_id);

      if (interviewUpdateError) throw interviewUpdateError;
    }

    const { error: deleteError } = await admin
      .from("employee_annual_events")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    return NextResponse.redirect(new URL(returnTo, req.url));
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "ERROR",
          message: e?.message ?? "年間イベントの削除に失敗しました",
        },
      },
      { status: 500 }
    );
  }
}