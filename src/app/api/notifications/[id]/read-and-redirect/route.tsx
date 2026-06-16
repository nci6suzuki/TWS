// src/app/api/notifications/[id]/read-and-redirect/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createActivityLog } from "@/lib/activity-logs/create-activity-log";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const me = await requireAuth();

    if (me.role !== "admin" && me.role !== "hr") {
      return NextResponse.redirect(new URL("/unauthorized", req.url), {
        status: 303,
      });
    }

    const { id } = await params;
    const admin = createSupabaseAdminClient();

    const toParam = req.nextUrl.searchParams.get("to") ?? "/notifications";

    const redirectTo =
      toParam.startsWith("/") && !toParam.startsWith("//")
        ? toParam
        : "/notifications";

    const { data: notification, error: fetchError } = await admin
      .from("notifications")
      .select(
        "id, employee_id, title, message, notification_type, severity, status, due_date, related_type, related_id"
      )
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.redirect(
        new URL(
          `/notifications?error=${encodeURIComponent(fetchError.message)}`,
          req.url
        ),
        { status: 303 }
      );
    }

    if (!notification) {
      return NextResponse.redirect(
        new URL(
          `/notifications?error=${encodeURIComponent("通知が見つかりません")}`,
          req.url
        ),
        { status: 303 }
      );
    }

    const readAt = new Date().toISOString();

    const { error } = await admin
      .from("notifications")
      .update({
        status: "read",
        read_at: readAt,
        read_by_employee_id: me.employeeId,
      })
      .eq("id", id);

    if (error) {
      return NextResponse.redirect(
        new URL(`/notifications?error=${encodeURIComponent(error.message)}`, req.url),
        { status: 303 }
      );
    }

    await createActivityLog({
      employeeId: notification.employee_id,
      actorEmployeeId: me.employeeId,
      activityType: "notification_read",
      title: "通知を既読にしました",
      description: `通知「${notification.title}」を既読にしました。`,
      relatedType: "notification",
      relatedId: notification.id,
      metadata: {
        notification_type: notification.notification_type,
        severity: notification.severity,
        due_date: notification.due_date,
        related_type: notification.related_type,
        related_id: notification.related_id,
        previous_status: notification.status,
        new_status: "read",
        read_at: readAt,
      },
    });

    return NextResponse.redirect(new URL(redirectTo, req.url), {
      status: 303,
    });
  } catch (e: any) {
    return NextResponse.redirect(
      new URL(
        `/notifications?error=${encodeURIComponent(
          e?.message ?? "通知の既読処理に失敗しました"
        )}`,
        req.url
      ),
      { status: 303 }
    );
  }
}