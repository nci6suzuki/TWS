// src/app/api/masters/departments/route.ts
import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/auth/require-auth-api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    await requireAuthApi();
    const supabase = createSupabaseServerClient();
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");

    let q = supabase
      .from("departments")
      .select("id, name, branch_id")
      .order("name", { ascending: true });

    if (branchId) q = q.eq("branch_id", branchId);

    const { data, error } = await q;
    if (error) throw error;

    return NextResponse.json({ success: true, data: { items: data ?? [] } });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: { code: "ERROR", message: e?.message ?? "取得に失敗しました" } },
      { status: 500 }
    );
  }
}