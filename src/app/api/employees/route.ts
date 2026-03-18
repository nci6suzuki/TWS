import { NextRequest, NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/auth/require-auth-api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createEmployee } from "@/lib/services/employee-service";
import { createEmployeeSchema } from "@/lib/validations/employee";
import { ZodError } from "zod";

export async function GET(req: NextRequest) {
  try {
    const me = await requireAuthApi();
    const supabase = await createSupabaseServerClient();

    const searchParams = req.nextUrl.searchParams;
    const page = Number(searchParams.get("page") ?? "1");
    const limit = Number(searchParams.get("limit") ?? "20");

    const branchId = searchParams.get("branchId");
    const departmentId = searchParams.get("departmentId");
    const positionId = searchParams.get("positionId");
    const gradeId = searchParams.get("gradeId");
    const keyword = searchParams.get("keyword");
    const sort = searchParams.get("sort") ?? "name";
    const order = searchParams.get("order") === "desc" ? false : true;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("employees")
      .select(
        `
        id,
        employee_code,
        name,
        email,
        status,
        branch_id,
        department_id,
        position_id,
        grade_id,
        branches(id, name, code),
        departments(id, name),
        positions(id, name),
        grades(id, name)
      `,
        { count: "exact" }
      );

    if (branchId) query = query.eq("branch_id", branchId);
    if (departmentId) query = query.eq("department_id", departmentId);
    if (positionId) query = query.eq("position_id", positionId);
    if (gradeId) query = query.eq("grade_id", gradeId);

    if (keyword) {
      query = query.or(
        `name.ilike.%${keyword}%,email.ilike.%${keyword}%,employee_code.ilike.%${keyword}%`
      );
    }

    if (me.role === "employee") {
      query = query.eq("id", me.employeeId);
    } else if (me.role === "manager") {
      if (me.scope?.branchIds?.length) {
        query = query.in("branch_id", me.scope.branchIds);
      }
    } else if (me.role === "mentor") {
      if (me.scope?.employeeIds?.length) {
        query = query.in("id", me.scope.employeeIds);
      }
    }

    const { data, error, count } = await query
      .order(sort, { ascending: order })
      .range(from, to);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: {
        items: data ?? [],
        pagination: {
          page,
          limit,
          total: count ?? 0,
          totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
        },
      },
    });
  } catch (e: any) {
    console.error("GET /api/employees error:", e);

    if (e instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: e.issues[0]?.message ?? "入力内容を確認してください",
          },
        },
        { status: 400 }
      );
    }

    if (e?.message === "UNAUTHORIZED") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "認証が必要です",
          },
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: e?.message ?? "ERROR",
          message: e?.message ?? "取得に失敗しました",
        },
      },
      { status: 500 }
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
    const input = createEmployeeSchema.parse({
      ...body,
      hrEmployeeId: me.employeeId,
    });

    const result = await createEmployee(
      input,
    );

    return NextResponse.json({ success: true, data: result });
  } catch (e: any) {
    console.error("POST /api/employees error:", e);

    if (e instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: e.issues[0]?.message ?? "入力内容を確認してください",
          },
        },
        { status: 400 }
      );
    }

    if (e?.message === "UNAUTHORIZED") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "認証が必要です",
          },
        },
        { status: 401 }
      );
    }

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