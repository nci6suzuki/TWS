// src/app/api/employees/[id]/qualifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/auth/require-auth-api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuthApi();

    const { id } = await params;
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("employee_qualifications")
      .select(`
        id,
        qualification_id,
        acquired_date,
        expires_on,
        status,
        memo,
        qualification_master:qualification_id ( id, name, category )
      `)
      .eq("employee_id", id)
      .order("expires_on", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data: { items: data ?? [] } });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "ERROR", message: e?.message ?? "取得に失敗しました" },
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuthApi();

    const { id } = await params;
    const supabase = createSupabaseServerClient();
    const body = await req.json();

    const { data, error } = await supabase
      .from("employee_qualifications")
      .insert({
        employee_id: id,
        qualification_id: body.qualificationId,
        acquired_date: body.acquiredDate,
        expires_on: body.expiresOn || null,
        status: body.status,
        memo: body.memo || null,
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: { id: data.id } });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "ERROR", message: e?.message ?? "登録に失敗しました" },
      },
      { status: 500 }
    );
  }
}