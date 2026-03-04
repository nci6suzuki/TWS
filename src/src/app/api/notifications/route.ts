// src/app/api/notifications/route.ts
import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/auth/require-auth-api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const me = await requireAuthApi();
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, title, body, is_read, created_at, related_table, related_id")
      .eq("user_employee_id", me.employeeId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: { items: data ?? [] } });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: { code: "ERROR", message: e?.message ?? "取得に失敗しました" } },
      { status: 500 }
    );
  }
}