import { NextRequest, NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/auth/require-auth-api";
import { createFollowup } from "@/lib/services/followup-service";

export async function POST(req: NextRequest) {
  try {
    const me = await requireAuthApi();

    if (me.role !== "admin" && me.role !== "hr" && me.role !== "manager") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "権限がありません" } },
        { status: 403 }
      );
    }

    const body = await req.json();

    const result = await createFollowup({
      me,
      input: {
        fiscalYear: Number(body.fiscalYear),
        quarter: Number(body.quarter),
        employeeId: body.employeeId,
        followupType: body.followupType,
        assigneeEmployeeId: body.assigneeEmployeeId,
        dueDate: body.dueDate,
        priority: Number(body.priority),
        note: body.note,
        status: body.status,
      },
    });

    return NextResponse.json({ success: true, data: result });
  } catch (e: any) {
    const message = e?.message ?? "登録に失敗しました";

    return NextResponse.json(
      { success: false, error: { code: message, message } },
      { status: 500 }
    );
  }
}