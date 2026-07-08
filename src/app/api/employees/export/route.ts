// src/app/api/employees/export/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type OrganizationUnitRow = {
  id: string;
  name: string;
};

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll(`"`, `""`)}"`;
}

function toCsv(rows: unknown[][]) {
  return rows.map((row) => row.map(csvEscape).join(",")).join("\r\n");
}

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function GET(req: NextRequest) {
  const me = await requireAuth();

  if (me.role !== "admin" && me.role !== "hr") {
    return NextResponse.json(
      { success: false, message: "権限がありません" },
      { status: 403 }
    );
  }

  const admin = createSupabaseAdminClient();
  const url = new URL(req.url);

  const q = url.searchParams.get("q") ?? "";
  const invite = url.searchParams.get("invite") ?? "";
  const attention = url.searchParams.get("attention") ?? "";
  const organizationUnitId = url.searchParams.get("organization_unit_id") ?? "all";

  const today = formatDate(new Date());

  const alertDateObj = new Date();
  alertDateObj.setDate(alertDateObj.getDate() + 30);
  const alertDate = formatDate(alertDateObj);

  let query = admin
    .from("employees")
    .select(
      "id, employee_code, name, email, app_role, status, user_id, last_invited_at, organization_unit_id"
    )
    .order("employee_code", { ascending: true })
    .limit(5000);

  if (q) {
    query = query.or(
      `employee_code.ilike.%${q}%,name.ilike.%${q}%,email.ilike.%${q}%`
    );
  }

  if (invite === "uninvited") {
    query = query.is("user_id", null);
  }

  if (organizationUnitId !== "all") {
    if (organizationUnitId === "unassigned") {
      query = query.is("organization_unit_id", null);
    } else {
      query = query.eq("organization_unit_id", organizationUnitId);
    }
  }

  const [{ data: employees, error }, { data: organizationUnits, error: orgError }] =
    await Promise.all([
      query,
      admin.from("organization_units").select("id, name"),
    ]);

  if (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }

  if (orgError) {
    return NextResponse.json(
      { success: false, message: orgError.message },
      { status: 500 }
    );
  }

  const organizations = (organizationUnits ?? []) as OrganizationUnitRow[];

  const organizationById = new Map(
    organizations.map((org) => [org.id, org.name])
  );

  const employeeIds = (employees ?? []).map((e) => e.id);

  const { data: qualifications } =
    employeeIds.length > 0
      ? await admin
          .from("employee_qualifications")
          .select("id, employee_id, qualification_name, expires_on, status")
          .in("employee_id", employeeIds)
      : { data: [] as any[] };

  const { data: annualEvents } =
    employeeIds.length > 0
      ? await admin
          .from("employee_annual_events")
          .select("id, employee_id, title, scheduled_date, status")
          .in("employee_id", employeeIds)
      : { data: [] as any[] };

  const { data: interviews } =
    employeeIds.length > 0
      ? await admin
          .from("employee_interviews")
          .select(
            "id, employee_id, next_interview_date, next_interview_completed_at"
          )
          .in("employee_id", employeeIds)
      : { data: [] as any[] };

  const attentionByEmployeeId = new Map<
    string,
    {
      total: number;
      expiredQualifications: number;
      soonQualifications: number;
      overdueEvents: number;
      pendingInterviews: number;
    }
  >();

  for (const employee of employees ?? []) {
    attentionByEmployeeId.set(employee.id, {
      total: 0,
      expiredQualifications: 0,
      soonQualifications: 0,
      overdueEvents: 0,
      pendingInterviews: 0,
    });
  }

  for (const q of qualifications ?? []) {
    if (!q.expires_on) continue;

    const item = attentionByEmployeeId.get(q.employee_id);
    if (!item) continue;

    if (q.expires_on < today) {
      item.expiredQualifications += 1;
      item.total += 1;
    } else if (q.expires_on <= alertDate) {
      item.soonQualifications += 1;
      item.total += 1;
    }
  }

  for (const event of annualEvents ?? []) {
    const item = attentionByEmployeeId.get(event.employee_id);
    if (!item) continue;

    if (event.status === "pending" && event.scheduled_date < today) {
      item.overdueEvents += 1;
      item.total += 1;
    }
  }

  for (const interview of interviews ?? []) {
    const item = attentionByEmployeeId.get(interview.employee_id);
    if (!item) continue;

    if (
      interview.next_interview_date &&
      !interview.next_interview_completed_at
    ) {
      item.pendingInterviews += 1;
      item.total += 1;
    }
  }

  let exportEmployees = employees ?? [];

  if (attention === "required") {
    exportEmployees = exportEmployees.filter((employee) => {
      const item = attentionByEmployeeId.get(employee.id);
      return (item?.total ?? 0) > 0;
    });
  }

  const rows: unknown[][] = [
    [
      "社員番号",
      "氏名",
      "メール",
      "所属組織",
      "ロール",
      "状態",
      "招待状況",
      "最終招待日時",
      "要対応件数",
      "資格期限切れ",
      "資格30日以内",
      "イベント期限超過",
      "次回面談予定",
    ],
  ];

  for (const employee of exportEmployees) {
    const attentionItem = attentionByEmployeeId.get(employee.id);
    const organizationName = getOrganizationName(
      employee.organization_unit_id,
      organizationById
    );

    rows.push([
      employee.employee_code,
      employee.name,
      employee.email,
      organizationName,
      getRoleLabel(employee.app_role),
      getStatusLabel(employee.status),
      employee.user_id ? "招待済み" : "未招待",
      employee.last_invited_at ?? "",
      attentionItem?.total ?? 0,
      attentionItem?.expiredQualifications ?? 0,
      attentionItem?.soonQualifications ?? 0,
      attentionItem?.overdueEvents ?? 0,
      attentionItem?.pendingInterviews ?? 0,
    ]);
  }

  const csv = "\uFEFF" + toCsv(rows);
  const filename = `employees_${today}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function getOrganizationName(
  organizationUnitId: string | null | undefined,
  organizationById: Map<string, string>
) {
  if (!organizationUnitId) return "未設定";

  return organizationById.get(organizationUnitId) ?? "未設定";
}

function getRoleLabel(role: string) {
  if (role === "admin") return "管理者";
  if (role === "hr") return "人事";
  if (role === "manager") return "上長";
  if (role === "mentor") return "メンター";
  if (role === "employee") return "社員";
  return role || "";
}

function getStatusLabel(status: string) {
  if (status === "active") return "在籍中";
  if (status === "leave") return "休職中";
  if (status === "inactive") return "退職・無効";
  return status || "";
}