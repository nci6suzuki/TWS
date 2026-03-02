// src/app/api/masters/branches/route.ts
import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/auth/require-auth-api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    await requireAuthApi();
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("branches")
      .select("id, name, code")
      .order("code", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data: { items: data ?? [] } });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: { code: "ERROR", message: e?.message ?? "取得に失敗しました" } },
      { status: 500 }
    );
  }
}