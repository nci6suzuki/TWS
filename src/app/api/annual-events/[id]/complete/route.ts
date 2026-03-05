// src/app/api/annual-events/[id]/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/auth/require-auth-api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuthApi();

    const { id } = await params;
    const supabase = createSupabaseServerClient();

    const { error } = await supabase
      .from("employee_annual_events")
      .update({ status: "done" })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true, data: { id } });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "ERROR", message: e?.message ?? "完了化に失敗しました" },
      },
      { status: 500 }
    );
  }
}