import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      employeeCode: string;
      qualificationId: string;
    }>;
  }
) {
  try {
    const me = await requireAuth();

    if (me.role !== "admin" && me.role !== "hr") {
      return NextResponse.json(
        { success: false, message: "権限がありません" },
        { status: 403 }
      );
    }

    const { employeeCode, qualificationId } = await params;

    const formData = await req.formData().catch(() => null);
    const returnTo = String(
      formData?.get("returnTo") ??
        `/employees/code/${employeeCode}/qualifications`
    );

    const admin = createSupabaseAdminClient();

    const { error } = await admin
      .from("employee_qualifications")
      .delete()
      .eq("id", qualificationId);

    if (error) throw error;

    return NextResponse.redirect(new URL(returnTo, req.url));
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        message: e?.message ?? "資格情報の削除に失敗しました",
      },
      { status: 500 }
    );
  }
}