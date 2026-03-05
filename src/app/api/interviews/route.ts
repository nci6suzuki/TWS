// src/app/api/interviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/auth/require-auth-api";
import { createInterviewSchema } from "@/lib/validations/interview";
import { canCreateInterview } from "@/lib/permissions/can";
import { createInterview } from "@/lib/services/interview-service";

export async function POST(req: NextRequest) {
  const me = await requireAuthApi();

  if (!canCreateInterview(me)) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "権限がありません" } },
      { status: 403 }
    );
  }

  const body = await req.json();
  const parsed = createInterviewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues[0]?.message ?? "入力が不正です",
        },
      },
      { status: 400 }
    );
  }

  const result = await createInterview({ me, input: parsed.data });

  return NextResponse.json({ success: true, data: { id: result.id } });
}