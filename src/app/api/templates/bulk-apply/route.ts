// src/app/api/templates/bulk-apply/route.ts
import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/auth/require-auth-api";
import { bulkApplyTemplateToEmployees } from "@/lib/services/template-bulk-service";
import { canManageTemplates } from "@/lib/permissions/can";

export async function POST(req: Request) {
  try {
    const me = await requireAuthApi();

    if (!canManageTemplates(me)) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "権限がありません" } },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (!body.templateId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "templateId は必須です" } },
        { status: 400 }
      );
    }

    const result = await bulkApplyTemplateToEmployees({
      templateId: body.templateId,
      branchId: body.branchId || undefined,
      departmentId: body.departmentId || undefined,
      positionId: body.positionId || undefined,
      gradeId: body.gradeId || undefined,
      employmentType: body.employmentType || undefined,
      hireDateFrom: body.hireDateFrom || undefined,
      hireDateTo: body.hireDateTo || undefined,
      skipIfAlreadyHasEvents: body.skipIfAlreadyHasEvents !== false,
      hrEmployeeId: me.employeeId,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "ERROR",
          message: e?.message ?? "一括適用に失敗しました",
        },
      },
      { status: 500 }
    );
  }
}