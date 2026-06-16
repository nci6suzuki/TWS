// src/app/api/admin/invite-employee/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createActivityLog } from "@/lib/activity-logs/create-activity-log";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const me = await requireAuth();

    if (me.role !== "admin" && me.role !== "hr") {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "権限がありません",
          },
        },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));

    const employeeId = String(body.employeeId ?? "").trim();
    const force = Boolean(body.force);

    if (!employeeId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "employeeId がありません",
          },
        },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdminClient();

    const { data: employee, error: employeeError } = await admin
      .from("employees")
      .select(
        "id, employee_code, name, email, app_role, status, user_id, last_invited_at"
      )
      .eq("id", employeeId)
      .maybeSingle();

    if (employeeError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: employeeError.message,
          },
        },
        { status: 500 }
      );
    }

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "社員情報が見つかりません",
          },
        },
        { status: 404 }
      );
    }

    if (!employee.email) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "メールアドレスが登録されていません",
          },
        },
        { status: 400 }
      );
    }

    if (employee.user_id && !force) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "すでに招待済みです。再招待する場合は再招待ボタンを使用してください。",
          },
        },
        { status: 400 }
      );
    }

    const origin = req.nextUrl.origin;

    const redirectTo =
      process.env.NEXT_PUBLIC_SITE_URL?.trim()
        ? `${process.env.NEXT_PUBLIC_SITE_URL.trim()}/welcome/setup-profile`
        : `${origin}/welcome/setup-profile`;

    const invitedAt = new Date().toISOString();

    const { data: inviteData, error: inviteError } =
      await admin.auth.admin.inviteUserByEmail(employee.email, {
        redirectTo,
        data: {
          employeeId: employee.id,
          employeeCode: employee.employee_code,
          role: employee.app_role,
        },
      });

    if (inviteError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: inviteError.message,
          },
        },
        { status: 500 }
      );
    }

    const invitedUserId = inviteData?.user?.id ?? employee.user_id ?? null;

    const updatePayload: Record<string, any> = {
      last_invited_at: invitedAt,
    };

    if (invitedUserId) {
      updatePayload.user_id = invitedUserId;
    }

    const { error: updateError } = await admin
      .from("employees")
      .update(updatePayload)
      .eq("id", employee.id);

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: updateError.message,
          },
        },
        { status: 500 }
      );
    }

    await createActivityLog({
      employeeId: employee.id,
      actorEmployeeId: me.employeeId,
      activityType: "invite_sent",
      title: force ? "再招待メールを送信しました" : "招待メールを送信しました",
      description: `${employee.email} 宛に${
        force ? "再招待メール" : "招待メール"
      }を送信しました。`,
      relatedType: "employee",
      relatedId: employee.id,
      metadata: {
        email: employee.email,
        employee_code: employee.employee_code,
        employee_name: employee.name,
        force,
        invited_at: invitedAt,
        invited_user_id: invitedUserId,
        redirect_to: redirectTo,
        previous_user_id: employee.user_id,
        previous_last_invited_at: employee.last_invited_at,
      },
    });

    return NextResponse.json({
      success: true,
      invited: true,
      force,
      employeeId: employee.id,
      userId: invitedUserId,
      message: force
        ? "再招待メールを送信しました"
        : "招待メールを送信しました",
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: e?.message ?? "招待処理に失敗しました",
        },
      },
      { status: 500 }
    );
  }
}