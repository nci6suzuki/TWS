// src/app/api/followups/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/auth/require-auth-api";
import { updateFollowup } from "@/lib/services/followup-service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await requireAuthApi();
    const { id } = await params;
    const body = await req.json();

    const result = await updateFollowup({
      me,
      followupId: id,
      input: body,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (e: any) {
    const message = e?.message ?? "更新に失敗しました";
    const status =
      message === "FORBIDDEN" ? 403 :
      message === "NOT_FOUND" ? 404 :
      500;

    return NextResponse.json(
      { success: false, error: { code: message, message } },
      { status }
    );
  }
}