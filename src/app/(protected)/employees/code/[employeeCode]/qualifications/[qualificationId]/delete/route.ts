// src/app/(protected)/employees/code/[employeeCode]/qualifications/[qualificationId]/delete/route.ts

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
    params: Promise<{ employeeCode: string; qualificationId: string }>;
  }
) {
  try {
    const me = await requireAuth();

    if (me.role !== "admin" && me.role !== "hr") {
      return NextResponse.redirect(new URL("/unauthorized", req.url), {
        status: 303,
      });
    }

    const { employeeCode, qualificationId } = await params;
    const code = decodeURIComponent(employeeCode).trim();

    const formData = await req.formData();

    const fallbackReturnTo = `/employees/code/${encodeURIComponent(
      code
    )}/qualifications`;

    const returnTo =
      String(formData.get("returnTo") ?? "").trim() || fallbackReturnTo;

    const safeReturnTo =
      returnTo.startsWith("/") && !returnTo.startsWith("//")
        ? returnTo
        : fallbackReturnTo;

    const admin = createSupabaseAdminClient();

    const { data: qualification, error: fetchError } = await admin
      .from("employee_qualifications")
      .select(
        "id, employee_id, qualification_name, acquired_on, expires_on, status, memo"
      )
      .eq("id", qualificationId)
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

    if (!qualification) {
      return NextResponse.redirect(
        new URL(
          `${safeReturnTo}${
            safeReturnTo.includes("?") ? "&" : "?"
          }error=${encodeURIComponent("資格情報が見つかりません")}`,
          req.url
        ),
        { status: 303 }
      );
    }

    const { error: deleteError } = await admin
      .from("employee_qualifications")
      .delete()
      .eq("id", qualificationId);

    if (deleteError) {
      return NextResponse.redirect(
        new URL(
          `${safeReturnTo}${
            safeReturnTo.includes("?") ? "&" : "?"
          }error=${encodeURIComponent(deleteError.message)}`,
          req.url
        ),
        { status: 303 }
      );
    }

    await createActivityLog({
      employeeId: qualification.employee_id,
      actorEmployeeId: me.employeeId,
      activityType: "qualification_deleted",
      title: "資格を削除しました",
      description: `「${qualification.qualification_name}」を削除しました。${
        qualification.expires_on
          ? `有効期限：${qualification.expires_on}`
          : "有効期限：未設定"
      }`,
      relatedType: "employee_qualification",
      relatedId: qualification.id,
      metadata: {
        qualification_name: qualification.qualification_name,
        acquired_on: qualification.acquired_on,
        expires_on: qualification.expires_on,
        status: qualification.status,
        memo: qualification.memo,
        deleted_at: new Date().toISOString(),
      },
    });

    const redirectUrl = `${safeReturnTo}${
      safeReturnTo.includes("?") ? "&" : "?"
    }deleted=${encodeURIComponent(qualification.qualification_name)}`;

    return NextResponse.redirect(new URL(redirectUrl, req.url), {
      status: 303,
    });
  } catch (e: any) {
    return NextResponse.redirect(
      new URL(
        `/employees?error=${encodeURIComponent(
          e?.message ?? "資格の削除に失敗しました"
        )}`,
        req.url
      ),
      { status: 303 }
    );
  }
}