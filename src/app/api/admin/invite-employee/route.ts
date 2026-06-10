import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseServerDbClient } from "@/lib/supabase/server-db";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const me = await requireAuth();

    if (me.role !== "admin" && me.role !== "hr") {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "権限がありません" },
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const employeeId = String(body.employeeId ?? "").trim();
    const force = Boolean(body.force ?? false);

    if (!employeeId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "BAD_REQUEST", message: "employeeId が必要です" },
        },
        { status: 400 }
      );
    }

    const db = await createSupabaseServerDbClient();

    const { data: emp, error: empErr } = await db
      .from("employees")
      .select("id, email, user_id, app_role")
      .eq("id", employeeId)
      .maybeSingle();

    if (empErr) throw empErr;

    if (!emp) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "社員が見つかりません" },
        },
        { status: 404 }
      );
    }

    if (!emp.email) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "BAD_REQUEST", message: "社員メールが未設定です" },
        },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdminClient();
    const role = emp.app_role ?? "employee";

    let userId = emp.user_id as string | null;

    // 既に user_id がある場合：再招待のみ許可
    if (userId) {
      if (!force) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "ALREADY_LINKED",
              message: "既に招待済みです。再招待ボタンから実行してください。",
            },
          },
          { status: 409 }
        );
      }

      // Auth側のroleを最新化
      const { error: updateUserErr } = await admin.auth.admin.updateUserById(userId, {
        user_metadata: {
          role,
        },
      });

      if (updateUserErr) throw updateUserErr;

      // 再招待メール送信
      const { error: inviteErr } = await admin.auth.admin.inviteUserByEmail(emp.email, {
        data: {
          role,
        },
      });

      if (inviteErr) throw inviteErr;
    } else {
      // 未招待：招待ユーザー作成
      const { data: invited, error: inviteErr } =
        await admin.auth.admin.inviteUserByEmail(emp.email, {
          data: {
            role,
          },
        });

      if (inviteErr) throw inviteErr;

      userId = invited.user?.id ?? null;

      if (!userId) {
        throw new Error("招待ユーザーIDを取得できませんでした");
      }
    }

    const { error: updErr } = await db
      .from("employees")
      .update({
        user_id: userId,
        last_invited_at: new Date().toISOString(),
        invited_by_employee_id: me.employeeId,
      })
      .eq("id", employeeId);

    if (updErr) throw updErr;

    return NextResponse.json({
      success: true,
      data: {
        employeeId,
        userId,
      },
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