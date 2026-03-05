import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/auth/require-auth-api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    await requireAuthApi();
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");

    let q = supabase
      .from("departments")
      .select("id, name, branch_id, branches:branch_id ( name )")
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

export async function POST(req: Request) {
  try {
    const me = await requireAuthApi();
    if (me.role !== "admin" && me.role !== "hr") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "権限がありません" } },
        { status: 403 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const body = await req.json();

    const { data, error } = await supabase
      .from("departments")
      .insert({
        name: body.name,
        branch_id: body.branchId,
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: { id: data.id } });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: { code: "ERROR", message: e?.message ?? "登録に失敗しました" } },
      { status: 500 }
    );
  }
}