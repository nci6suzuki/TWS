// src/app/api/notifications/mark-read/route.ts
import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/auth/require-auth-api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const me = await requireAuthApi();
    const supabase = createSupabaseServerClient();
    const body = await req.json();

    const ids: string[] = body.notificationIds ?? [];

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "notificationIds が必要です" } },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_employee_id", me.employeeId)
      .in("id", ids);

    if (error) throw error;

    return NextResponse.json({ success: true, data: { updated: ids.length } });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: { code: "ERROR", message: e?.message ?? "更新に失敗しました" } },
      { status: 500 }
    );
  }
}