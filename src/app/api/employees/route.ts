// src/app/api/employees/route.ts
import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/auth/require-auth-api";
import { createEmployee } from "@/lib/services/employee-service";
import { getEmployees } from "@/lib/queries/employees";

export async function GET(req: Request) {
  try {
    const me = await requireAuthApi();

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId") || undefined;
    const departmentId = searchParams.get("departmentId") || undefined;
    const positionId = searchParams.get("positionId") || undefined;
    const gradeId = searchParams.get("gradeId") || undefined;
    const keyword = searchParams.get("keyword") || undefined;
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 20);
    const sort = searchParams.get("sort") || undefined;
    const order = (searchParams.get("order") as "asc" | "desc" | null) ?? undefined;

    const result = await getEmployees({
      me,
      branchId,
      departmentId,
      positionId,
      gradeId,
      keyword,
      page,
      limit,
      sort,
      order: order ?? "asc",
    });

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

    // ここで hrEmployeeId を付与（フロントから送らなくてOK）
    const input = {
      ...body,
      hrEmployeeId: me.employeeId,
    };

    const result = await createEmployee({ input });

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