// src/app/api/notifications/[id]/read-and-redirect/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    const { id } = await params;
    const admin = createSupabaseAdminClient();

    const toParam = req.nextUrl.searchParams.get("to") ?? "/notifications";

    const redirectTo =
      toParam.startsWith("/") && !toParam.startsWith("//")
        ? toParam
        : "/notifications";

    const { error } = await admin
      .from("notifications")
      .update({
        status: "read",
        read_at: new Date().toISOString(),
        read_by_employee_id: me.employeeId,
      })
      .eq("id", id);

    if (error) {
      return NextResponse.redirect(
        new URL(`/notifications?error=${encodeURIComponent(error.message)}`, req.url)
      );
    }

    return NextResponse.redirect(new URL(redirectTo, req.url));
  } catch (e: any) {
    return NextResponse.redirect(
      new URL(
        `/notifications?error=${encodeURIComponent(
          e?.message ?? "通知の既読処理に失敗しました"
        )}`,
        req.url
      )
    );
  }
}