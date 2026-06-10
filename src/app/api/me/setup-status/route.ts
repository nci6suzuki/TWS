import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseServerDbClient } from "@/lib/supabase/server-db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const me = await requireAuth();
    const db = await createSupabaseServerDbClient();

    const { data, error } = await db
      .from("employees")
      .select("id, initial_profile_completed_at")
      .eq("id", me.employeeId)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: {
        needsSetup: !data?.initial_profile_completed_at,
        completedAt: data?.initial_profile_completed_at ?? null,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: e?.message ?? "初回設定状態の取得に失敗しました",
        },
      },
      { status: 500 }
    );
  }
}