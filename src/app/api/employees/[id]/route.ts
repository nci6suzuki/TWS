// src/app/api/employees/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/auth/require-auth-api";
import { updateEmployee } from "@/lib/services/employee-service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await requireAuthApi();
    const { id } = await params;

    if (me.role !== "admin" && me.role !== "hr") {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "権限がありません" },
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const result = await updateEmployee({
      me,
      employeeId: id,
      input: body,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (e: any) {
    const message = e?.message ?? "更新に失敗しました";
    const status = message === "NOT_FOUND" ? 404 : 500;

    return NextResponse.json(
      { success: false, error: { code: message, message } },
      { status }
    );
  }
}