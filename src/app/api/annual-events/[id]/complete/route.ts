import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerDbClient } from "@/lib/supabase/server-db";
import { requireAuthApi } from "@/lib/auth/require-auth-api";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuthApi(req);
    const { id } = await params;

    const supabase = await createSupabaseServerDbClient();
    const { error } = await supabase
      .from("employee_annual_events")
      .update({ status: "done" })
      .eq("id", id);

    if (error) throw error;

    // 完了後は詳細へ戻す
    return NextResponse.redirect(new URL(`/annual-events/${id}`, req.url), { status: 303 });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: { code: "ERROR", message: e?.message ?? "完了化に失敗しました" } },
      { status: 500 }
    );
  }
}