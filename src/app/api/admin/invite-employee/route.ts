import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuthApi } from "@/lib/auth/require-auth-api";

export async function POST(req: Request) {
  try {
    const me = await requireAuthApi();

    if (!["admin", "hr"].includes(me.role)) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "権限がありません" } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { employeeId, email, redirectTo } = body;

    if (!employeeId || !email) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "employeeId と email は必須です" } },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const inviteResult = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
    });

    if (inviteResult.error) throw inviteResult.error;

    const userId = inviteResult.data.user?.id;
    if (!userId) throw new Error("招待ユーザーIDを取得できませんでした");

    const { error: updateErr } = await supabaseAdmin
      .from("employees")
      .update({
        user_id: userId,
        email,
        last_invited_at: new Date().toISOString(),
        invited_by_employee_id: me.employeeId,
      })
      .eq("id", employeeId);

    if (updateErr) throw updateErr;

    return NextResponse.json({
      success: true,
      data: { employeeId, userId, email },
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "ERROR",
          message: e?.message ?? "招待に失敗しました",
        },
      },
      { status: 500 }
    );
  }
}