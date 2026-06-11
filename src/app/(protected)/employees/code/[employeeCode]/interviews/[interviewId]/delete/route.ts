import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      employeeCode: string;
      interviewId: string;
    }>;
  }
) {
  try {
    const me = await requireAuth();

    if (me.role !== "admin" && me.role !== "hr") {
      return NextResponse.json(
        { success: false, message: "権限がありません" },
        { status: 403 }
      );
    }

    const { employeeCode, interviewId } = await params;

    const formData = await req.formData().catch(() => null);
    const returnTo = String(
      formData?.get("returnTo") ?? `/employees/code/${employeeCode}/interviews`
    );

    const admin = createSupabaseAdminClient();

    /**
     * 面談履歴から自動作成された年間イベントがあれば先に削除
     */
    const { error: eventDeleteError } = await admin
      .from("employee_annual_events")
      .delete()
      .eq("source_type", "employee_interview")
      .eq("source_id", interviewId);

    if (eventDeleteError) throw eventDeleteError;

    const { error } = await admin
      .from("employee_interviews")
      .delete()
      .eq("id", interviewId);

    if (error) throw error;

    return NextResponse.redirect(new URL(returnTo, req.url));
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        message: e?.message ?? "面談履歴の削除に失敗しました",
      },
      { status: 500 }
    );
  }
}