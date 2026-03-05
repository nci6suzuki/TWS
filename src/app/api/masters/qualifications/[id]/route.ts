import { NextRequest, NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/auth/require-auth-api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await requireAuthApi();
    const { id } = await params;

    if (me.role !== "admin" && me.role !== "hr") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "権限がありません" } },
        { status: 403 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const body = await req.json();

    const { error } = await supabase
      .from("qualification_master")
      .update({
        name: body.name,
        category: body.category || null,
      })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true, data: { id } });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: { code: "ERROR", message: e?.message ?? "更新に失敗しました" } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await requireAuthApi();
    const { id } = await params;

    if (me.role !== "admin" && me.role !== "hr") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "権限がありません" } },
        { status: 403 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("qualification_master")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true, data: { id } });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: { code: "ERROR", message: e?.message ?? "削除に失敗しました" } },
      { status: 500 }
    );
  }
}