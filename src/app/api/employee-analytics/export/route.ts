// src/app/api/employee-analytics/export/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type EmployeeRow = {
  id: string;
  employee_code: string | null;
  name: string | null;
  email: string | null;
  app_role: string | null;
  status: string | null;
  employment_type: string | null;
  hire_date: string | null;
  birth_date: string | null;
  gender: string | null;
  is_management_role: boolean | null;
  organization_unit_id: string | null;
};

type OrganizationUnitRow = {
  id: string;
  name: string;
};

export async function GET(req: NextRequest) {
  const me = await requireAuth();

  if (me.role !== "admin" && me.role !== "hr" && me.role !== "manager") {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  }

  const url = new URL(req.url);

  const statusFilter = url.searchParams.get("status") || "active";
  const genderFilter = url.searchParams.get("gender") || "all";
  const managementFilter = url.searchParams.get("management") || "all";
  const employmentTypeFilter =
    url.searchParams.get("employment_type") || "all";
  const organizationUnitIdFilter =
    url.searchParams.get("organization_unit_id") || "all";

  const incompleteFilter = url.searchParams.get("incomplete") || "";

  const admin = createSupabaseAdminClient();

  const [{ data, error }, { data: organizationUnits, error: orgError }] =
    await Promise.all([
      admin
        .from("employees")
        .select(
          "id, employee_code, name, email, app_role, status, employment_type, hire_date, birth_date, gender, is_management_role, organization_unit_id"
        )
        .order("employee_code", { ascending: true }),
      admin
        .from("organization_units")
        .select("id, name")
        .order("name", { ascending: true }),
    ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (orgError) {
    return NextResponse.json({ error: orgError.message }, { status: 500 });
  }

  const organizationById = new Map(
    ((organizationUnits ?? []) as OrganizationUnitRow[]).map((org) => [
      org.id,
      org.name,
    ])
  );

  const employees = ((data ?? []) as EmployeeRow[]).filter((e) => {
    if (statusFilter !== "all" && e.status !== statusFilter) {
      return false;
    }

    if (genderFilter !== "all" && normalizeGender(e.gender) !== genderFilter) {
      return false;
    }

    if (managementFilter === "management" && e.is_management_role !== true) {
      return false;
    }

    if (
      managementFilter === "non_management" &&
      e.is_management_role === true
    ) {
      return false;
    }

    if (employmentTypeFilter !== "all") {
      if (employmentTypeFilter === "unknown") {
        if (e.employment_type) return false;
      } else if (e.employment_type !== employmentTypeFilter) {
        return false;
      }
    }

    if (organizationUnitIdFilter !== "all") {
      if (organizationUnitIdFilter === "unassigned") {
        if (e.organization_unit_id) return false;
      } else if (e.organization_unit_id !== organizationUnitIdFilter) {
        return false;
      }
    }

    if (incompleteFilter === "analytics") {
      const gender = normalizeGender(e.gender);

      if (e.birth_date && gender !== "unknown") {
        return false;
      }
    }

    return true;
  });

  const header = [
    "社員番号",
    "氏名",
    "メール",
    "所属組織",
    "在籍状態",
    "雇用区分",
    "システムロール",
    "入社日",
    "生年月日",
    "年齢",
    "性別",
    "役職者",
    "未入力項目",
  ];

  const rows = employees.map((e) => {
    const age = calcAge(e.birth_date);
    const missingItems = buildMissingItems(e);
    const organizationName = getOrganizationName(e, organizationById);

    return [
      e.employee_code ?? "",
      e.name ?? "",
      e.email ?? "",
      organizationName,
      getStatusLabel(e.status),
      getEmploymentLabel(e.employment_type),
      e.app_role ?? "",
      e.hire_date ?? "",
      e.birth_date ?? "",
      age === null ? "" : String(age),
      getGenderLabel(e.gender),
      e.is_management_role ? "対象" : "対象外",
      missingItems.join(" / "),
    ];
  });

  const csv = [
    header.map(csvEscape).join(","),
    ...rows.map((row) => row.map(csvEscape).join(",")),
  ].join("\r\n");

  const bom = "\uFEFF";

  return new NextResponse(bom + csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${buildFileName({
        status: statusFilter,
        gender: genderFilter,
        management: managementFilter,
        employmentType: employmentTypeFilter,
        organizationUnitId: organizationUnitIdFilter,
        incomplete: incompleteFilter,
      })}"`,
    },
  });
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll(`"`, `""`)}"`;
}

function calcAge(birthDate: string | null) {
  if (!birthDate) return null;

  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();

  const monthDiff = today.getMonth() - birth.getMonth();
  const dayDiff = today.getDate() - birth.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  if (age < 0 || age > 120) return null;

  return age;
}

function normalizeGender(
  value: string | null
): "male" | "female" | "other" | "unknown" {
  if (!value) return "unknown";

  if (value === "male") return "male";
  if (value === "female") return "female";
  if (value === "other") return "other";

  return "unknown";
}

function getGenderLabel(value: string | null) {
  if (value === "male") return "男性";
  if (value === "female") return "女性";
  if (value === "other") return "その他";
  if (value === "unknown") return "未設定";

  return "未設定";
}

function getEmploymentLabel(value: string | null) {
  if (value === "full_time") return "正社員";
  if (value === "contract") return "契約社員";
  if (value === "part_time") return "パート";
  if (value === "other") return "その他";
  if (!value) return "未設定";

  return value;
}

function getStatusLabel(value: string | null) {
  if (value === "active") return "在籍中";
  if (value === "leave") return "休職中";
  if (value === "inactive") return "退職・無効";
  if (!value) return "未設定";

  return value;
}

function getOrganizationName(
  employee: EmployeeRow,
  organizationById: Map<string, string>
) {
  if (!employee.organization_unit_id) return "未設定";

  return organizationById.get(employee.organization_unit_id) ?? "未設定";
}

function buildMissingItems(employee: EmployeeRow) {
  const items: string[] = [];

  if (!employee.birth_date) {
    items.push("生年月日");
  }

  if (normalizeGender(employee.gender) === "unknown") {
    items.push("性別");
  }

  return items;
}

function buildFileName({
  status,
  gender,
  management,
  employmentType,
  organizationUnitId,
  incomplete,
}: {
  status: string;
  gender: string;
  management: string;
  employmentType: string;
  organizationUnitId: string;
  incomplete: string;
}) {
  const parts = ["employee-analytics"];

  if (incomplete === "analytics") parts.push("incomplete");
  if (status && status !== "active") parts.push(`status-${status}`);
  if (gender && gender !== "all") parts.push(`gender-${gender}`);
  if (management && management !== "all") parts.push(`management-${management}`);
  if (employmentType && employmentType !== "all") {
    parts.push(`employment-${employmentType}`);
  }
  if (organizationUnitId && organizationUnitId !== "all") {
    parts.push(`org-${organizationUnitId}`);
  }

  return `${parts.join("_")}.csv`;
}