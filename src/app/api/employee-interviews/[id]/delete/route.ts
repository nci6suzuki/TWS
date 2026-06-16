// src/app/api/employee-interviews/[id]/delete/route.ts

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

    const employeeCode = String(formData.get("employeeCode") ?? "").trim();

    const fallbackReturnTo = employeeCode
      ? `/employees/code/${encodeURIComponent(employeeCode)}/interviews`
      : "/employees";

    const returnTo =
      String(formData.get("returnTo") ?? "").trim() || fallbackReturnTo;

    const safeReturnTo =
      returnTo.startsWith("/") && !returnTo.startsWith("//")
        ? returnTo
        : fallbackReturnTo;

    const admin = createSupabaseAdminClient();

    const { data: interview, error: fetchError } = await admin
      .from("employee_interviews")
      .select(
        "id, employee_id, interview_date, interview_type, interviewer_name, summary, action_items, next_interview_date, next_interview_completed_at"
      )
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.redirect(
        new URL(
          `${safeReturnTo}${
            safeReturnTo.includes("?") ? "&" : "?"
          }error=${encodeURIComponent(fetchError.message)}`,
          req.url
        ),
        { status: 303 }
      );
    }

    if (!interview) {
      return NextResponse.redirect(
        new URL(
          `${safeReturnTo}${
            safeReturnTo.includes("?") ? "&" : "?"
          }error=${encodeURIComponent("面談記録が見つかりません")}`,
          req.url
        ),
        { status: 303 }
      );
    }

    const { data: linkedEvents, error: linkedEventsError } = await admin
      .from("employee_annual_events")
      .select("id, title, scheduled_date")
      .eq("source_type", "employee_interview")
      .eq("source_id", id);

    if (linkedEventsError) {
      return NextResponse.redirect(
        new URL(
          `${safeReturnTo}${
            safeReturnTo.includes("?") ? "&" : "?"
          }error=${encodeURIComponent(linkedEventsError.message)}`,
          req.url
        ),
        { status: 303 }
      );
    }

    const { error: deleteEventsError } = await admin
      .from("employee_annual_events")
      .delete()
      .eq("source_type", "employee_interview")
      .eq("source_id", id);

    if (deleteEventsError) {
      return NextResponse.redirect(
        new URL(
          `${safeReturnTo}${
            safeReturnTo.includes("?") ? "&" : "?"
          }error=${encodeURIComponent(deleteEventsError.message)}`,
          req.url
        ),
        { status: 303 }
      );
    }

    const { error: deleteInterviewError } = await admin
      .from("employee_interviews")
      .delete()
      .eq("id", id);

    if (deleteInterviewError) {
      return NextResponse.redirect(
        new URL(
          `${safeReturnTo}${
            safeReturnTo.includes("?") ? "&" : "?"
          }error=${encodeURIComponent(deleteInterviewError.message)}`,
          req.url
        ),
        { status: 303 }
      );
    }

    await createActivityLog({
      employeeId: interview.employee_id,
      actorEmployeeId: me.employeeId,
      activityType: "interview_deleted",
      title: "面談記録を削除しました",
      description: `「${getInterviewTypeLabel(
        interview.interview_type
      )}」を削除しました。面談日：${interview.interview_date ?? "-"}`,
      relatedType: "employee_interview",
      relatedId: interview.id,
      metadata: {
        interview_date: interview.interview_date,
        interview_type: interview.interview_type,
        interviewer_name: interview.interviewer_name,
        summary: interview.summary,
        action_items: interview.action_items,
        next_interview_date: interview.next_interview_date,
        next_interview_completed_at: interview.next_interview_completed_at,
        deleted_linked_annual_events: linkedEvents ?? [],
        deleted_at: new Date().toISOString(),
      },
    });

    const redirectUrl = `${safeReturnTo}${
      safeReturnTo.includes("?") ? "&" : "?"
    }deleted=${encodeURIComponent(interview.interview_date ?? "面談記録")}`;

    return NextResponse.redirect(new URL(redirectUrl, req.url), {
      status: 303,
    });
  } catch (e: any) {
    return NextResponse.redirect(
      new URL(
        `/employees?error=${encodeURIComponent(
          e?.message ?? "面談記録の削除に失敗しました"
        )}`,
        req.url
      ),
      { status: 303 }
    );
  }
}

function getInterviewTypeLabel(type: string) {
  if (type === "regular") return "定期面談";
  if (type === "career") return "キャリア面談";
  if (type === "followup") return "フォロー面談";
  if (type === "evaluation") return "評価面談";
  if (type === "other") return "その他";
  return type || "面談";
}