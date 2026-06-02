// src/app/api/employees/[id]/route.ts
import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/auth/require-auth-api";
import { updateEmployee } from "@/lib/services/employee-service";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const me = await requireAuthApi(req);

    if (me.role !== "admin" && me.role !== "hr") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "権限がありません" } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const result = await updateEmployee({ me, employeeId: params.id, input: body });

    return NextResponse.json({ success: true, data: result });
  } catch (e: any) {
    const msg = e?.message ?? "ERROR";
    const status = msg === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json(
      { success: false, error: { code: msg, message: msg === "UNAUTHORIZED" ? "認証が必要です" : msg } },
      { status }
    );
  }
}