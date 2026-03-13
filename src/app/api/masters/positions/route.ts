//app/api/masters/positions/route.ts
import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/auth/require-auth-api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    await requireAuthApi();
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.from("positions").select("*");

    if (error) throw error;

    const items = (data ?? []).map((row: any) => ({
      id: row.id,
      name: row.name ?? row.position_name ?? row.positionName ?? "",
      sort_order: row.sort_order ?? row.sortOrder ?? 0,
    }));

    return NextResponse.json({ success: true, data: { items } });
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
      .from("positions")
      .insert({
        name: body.name,
        sort_order: body.sortOrder || 0,
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