// src/app/api/employees/[id]/career-goals/route.ts
import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/auth/require-auth-api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const me = await requireAuthApi();
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("employee_career_goals")
      .select(`
        id,
        employee_id,
        goal_1y,
        goal_3y,
        desired_role,
        desired_career_path,
        reskilling_interest,
        mobility_preference,
        self_comment,
        updated_at
      `)
      .eq("employee_id", params.id)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: { code: "ERROR", message: e?.message ?? "取得に失敗しました" } },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const me = await requireAuthApi();
    const supabase = createSupabaseServerClient();
    const body = await req.json();

    // 本人、自分の上長、人事、adminだけに絞る運用も可
    // 今回は簡易で employee本人 or hr/admin にしておく
    const canEdit =
      me.role === "admin" ||
      me.role === "hr" ||
      me.employeeId === params.id;

    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "権限がありません" } },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("employee_career_goals")
      .update({
        goal_1y: body.goal1y ?? null,
        goal_3y: body.goal3y ?? null,
        desired_role: body.desiredRole ?? null,
        desired_career_path: body.desiredCareerPath ?? null,
        reskilling_interest: body.reskillingInterest ?? null,
        mobility_preference: body.mobilityPreference ?? null,
        self_comment: body.selfComment ?? null,
      })
      .eq("employee_id", params.id);

    if (error) throw error;

    return NextResponse.json({ success: true, data: { id: params.id } });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: { code: "ERROR", message: e?.message ?? "更新に失敗しました" } },
      { status: 500 }
    );
  }
}