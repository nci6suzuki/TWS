// src/app/api/annual-events/[id]/complete/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createActivityLog } from "@/lib/activity-logs/create-activity-log";

export const runtime = "nodejs";

export async function POST(
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
    const formData = await req.formData();

    const returnTo =
      String(formData.get("returnTo") ?? "") || `/annual-events/${id}`;

    const safeReturnTo =
      returnTo.startsWith("/") && !returnTo.startsWith("//")
        ? returnTo
        : `/annual-events/${id}`;

    const admin = createSupabaseAdminClient();

    const { data: beforeEvent, error: beforeError } = await admin
      .from("employee_annual_events")
      .select(
        "id, employee_id, title, event_type, scheduled_date, status, source_type, source_id"
      )
      .eq("id", id)
      .maybeSingle();

    if (beforeError) {
      return NextResponse.redirect(
        new URL(
          `${safeReturnTo}${
            safeReturnTo.includes("?") ? "&" : "?"
          }error=${encodeURIComponent(beforeError.message)}`,
          req.url
        ),
        { status: 303 }
      );
    }

    if (!beforeEvent) {
      return NextResponse.redirect(
        new URL(
          `${safeReturnTo}${
            safeReturnTo.includes("?") ? "&" : "?"
          }error=${encodeURIComponent("年間イベントが見つかりません")}`,
          req.url
        ),
        { status: 303 }
      );
    }

    const completedAt = new Date().toISOString();

    const { error: updateError } = await admin
      .from("employee_annual_events")
      .update({
        status: "done",
        completed_at: completedAt,
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.redirect(
        new URL(
          `${safeReturnTo}${
            safeReturnTo.includes("?") ? "&" : "?"
          }error=${encodeURIComponent(updateError.message)}`,
          req.url
        ),
        { status: 303 }
      );
    }

    if (
      beforeEvent.source_type === "employee_interview" &&
      beforeEvent.source_id
    ) {
      await admin
        .from("employee_interviews")
        .update({
          next_interview_completed_at: completedAt,
          next_interview_completed_event_id: id,
        })
        .eq("id", beforeEvent.source_id);
    }

    await createActivityLog({
      employeeId: beforeEvent.employee_id,
      actorEmployeeId: me.employeeId,
      activityType: "annual_event_completed",
      title: "年間イベントを完了にしました",
      description: `「${beforeEvent.title}」を完了にしました。予定日：${
        beforeEvent.scheduled_date ?? "-"
      }`,
      relatedType: "employee_annual_event",
      relatedId: beforeEvent.id,
      metadata: {
        event_type: beforeEvent.event_type,
        scheduled_date: beforeEvent.scheduled_date,
        previous_status: beforeEvent.status,
        new_status: "done",
        completed_at: completedAt,
        source_type: beforeEvent.source_type,
        source_id: beforeEvent.source_id,
      },
    });

    return NextResponse.redirect(new URL(safeReturnTo, req.url), {
      status: 303,
    });
  } catch (e: any) {
    return NextResponse.redirect(
      new URL(
        `/annual-events?error=${encodeURIComponent(
          e?.message ?? "年間イベントの完了化に失敗しました"
        )}`,
        req.url
      ),
      { status: 303 }
    );
  }
}