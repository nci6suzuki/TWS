// src/app/api/employee-qualifications/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/auth/require-auth-api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuthApi();

    const { id } = await params;
    const supabase = createSupabaseServerClient();
    const body = await req.json();

    const { error } = await supabase
      .from("employee_qualifications")
      .update({
        qualification_id: body.qualificationId,
        acquired_date: body.acquiredDate,
        expires_on: body.expiresOn || null,
        status: body.status,
        memo: body.memo || null,
      })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true, data: { id } });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "ERROR", message: e?.message ?? "更新に失敗しました" },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuthApi();

    const { id } = await params;
    const supabase = createSupabaseServerClient();

    const { error } = await supabase
      .from("employee_qualifications")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true, data: { id } });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "ERROR", message: e?.message ?? "削除に失敗しました" },
      },
      { status: 500 }
    );
  }
}