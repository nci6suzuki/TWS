// src/app/api/employees/route.ts
import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/auth/require-auth-api";
import { createEmployee } from "@/lib/services/employee-service";

export async function POST(req: Request) {
  try {
    const me = await requireAuthApi();

    if (me.role !== "admin" && me.role !== "hr") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "権限がありません" } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const result = await createEmployee({ me, input: body });

    return NextResponse.json({ success: true, data: result });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: e?.message ?? "ERROR",
          message: e?.message ?? "登録に失敗しました",
        },
      },
      { status: 500 }
    );
  }
}