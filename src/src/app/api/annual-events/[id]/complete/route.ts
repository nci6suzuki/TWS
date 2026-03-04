// src/app/api/annual-events/[id]/complete/route.ts
import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/auth/require-auth-api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuthApi();
    const supabase = createSupabaseServerClient();

    const { error } = await supabase
      .from("employee_annual_events")
      .update({ status: "done" })
      .eq("id", params.id);

    if (error) throw error;

    return NextResponse.json({ success: true, data: { id: params.id } });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: { code: "ERROR", message: e?.message ?? "完了化に失敗しました" } },
      { status: 500 }
    );
  }
}