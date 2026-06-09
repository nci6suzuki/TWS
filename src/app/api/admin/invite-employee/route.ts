import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseServerDbClient } from "@/lib/supabase/server-db";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const me = await requireAuth();
    if (me.role !== "admin" && me.role !== "hr") {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "権限がありません" } }, { status: 403 });
    }

    const body = await req.json();
    const employeeId = String(body.employeeId ?? "").trim();
    if (!employeeId) {
      return NextResponse.json({ success: false, error: { code: "BAD_REQUEST", message: "employeeId が必要です" } }, { status: 400 });
    }

    const db = await createSupabaseServerDbClient();

    // 招待対象の社員を取得
    const { data: emp, error: empErr } = await db
      .from("employees")
      .select("id, email, user_id")
      .eq("id", employeeId)
      .maybeSingle();

    if (empErr) throw empErr;
    if (!emp) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "社員が見つかりません" } }, { status: 404 });
    }
    if (!emp.email) {
      return NextResponse.json({ success: false, error: { code: "BAD_REQUEST", message: "社員メールが未設定です" } }, { status: 400 });
    }

    // Authに招待（Service Role）
    const admin = createSupabaseAdminClient();
    const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(emp.email, {
      data: {
        role: "employee", // 初期ロール（必要なら employees.app_role に合わせて後で更新）
      },
    });
    if (inviteErr) throw inviteErr;

    const invitedUserId = invited.user?.id;
    if (!invitedUserId) throw new Error("INVITE_FAILED_NO_USER_ID");

    // employees に紐付け＋招待履歴
    const { error: updErr } = await db
      .from("employees")
      .update({
        user_id: invitedUserId,
        last_invited_at: new Date().toISOString(),
        invited_by_employee_id: me.employeeId,
      })
      .eq("id", employeeId);

    if (updErr) throw updErr;

    return NextResponse.json({ success: true, data: { employeeId, invitedUserId } });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: { code: "ERROR", message: e?.message ?? "招待に失敗しました" } },
      { status: 500 }
    );
  }
}