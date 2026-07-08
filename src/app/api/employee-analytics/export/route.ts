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
  manager_employee_id: string | null;
  position_title: string | null;
  position_started_on: string | null;
};

type OrganizationUnitRow = {
  id: string;
  name: string;
};

type ManagerRow = {
  id: string;
  employee_code: string | null;
  name: string | null;
};

type PositionHistoryRow = {
  id: string;
  employee_id: string;
  change_type: string | null;
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
          "id, employee_code, name, email, app_role, status, employment_type, hire_date, birth_date, gender, is_management_role, organization_unit_id, manager_employee_id, position_title, position_started_on"
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

  const allEmployees = (data ?? []) as EmployeeRow[];

  const organizationById = new Map(
    ((organizationUnits ?? []) as OrganizationUnitRow[]).map((org) => [
      org.id,
      org.name,
    ])
  );

  const managerIds = Array.from(
    new Set(
      allEmployees
        .map((employee) => employee.manager_employee_id)
        .filter(Boolean)
    )
  ) as string[];

  const { data: managers, error: managersError } =
    managerIds.length > 0
      ? await admin
          .from("employees")
          .select("id, employee_code, name")
          .in("id", managerIds)
      : { data: [] as ManagerRow[], error: null };

  if (managersError) {
    return NextResponse.json({ error: managersError.message }, { status: 500 });
  }

  const managerById = new Map(
    ((managers ?? []) as ManagerRow[]).map((manager) => [manager.id, manager])
  );

  const allEmployeeIds = allEmployees.map((employee) => employee.id);

  const { data: positionHistoriesData, error: positionHistoriesError } =
    allEmployeeIds.length > 0
      ? await admin
          .from("employee_position_histories")
          .select("id, employee_id, change_type")
          .in("employee_id", allEmployeeIds)
      : { data: [] as PositionHistoryRow[], error: null };

  if (positionHistoriesError) {
    return NextResponse.json(
      { error: positionHistoriesError.message },
      { status: 500 }
    );
  }

  const positionHistories =
    (positionHistoriesData ?? []) as PositionHistoryRow[];

  const positionHistorySummaryByEmployeeId = buildPositionHistorySummary(
    positionHistories
  );

  const employees = allEmployees.filter((e) => {
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
      const missingItems = buildMissingItems(e);

      if (missingItems.length === 0) {
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
    "直属上司",
    "現在役職",
    "役職開始日",
    "在籍状態",
    "雇用区分",
    "システムロール",
    "入社日",
    "生年月日",
    "年齢",
    "性別",
    "役職者",
    "昇格回数",
    "降格回数",
    "役職履歴件数",
    "未入力項目",
  ];

  const rows = employees.map((e) => {
    const age = calcAge(e.birth_date);
    const missingItems = buildMissingItems(e);
    const organizationName = getOrganizationName(e, organizationById);
    const managerName = getManagerName(e.manager_employee_id, managerById);

    const positionSummary = positionHistorySummaryByEmployeeId.get(e.id) ?? {
      total: 0,
      promotions: 0,
      demotions: 0,
    };

    return [
      e.employee_code ?? "",
      e.name ?? "",
      e.email ?? "",
      organizationName,
      managerName,
      e.position_title ?? "未設定",
      e.position_started_on ?? "",
      getStatusLabel(e.status),
      getEmploymentLabel(e.employment_type),
      e.app_role ?? "",
      e.hire_date ?? "",
      e.birth_date ?? "",
      age === null ? "" : String(age),
      getGenderLabel(e.gender),
      e.is_management_role ? "対象" : "対象外",
      positionSummary.promotions,
      positionSummary.demotions,
      positionSummary.total,
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

function getManagerName(
  managerEmployeeId: string | null | undefined,
  managerById: Map<string, ManagerRow>
) {
  if (!managerEmployeeId) return "未設定";

  const manager = managerById.get(managerEmployeeId);
  if (!manager) return "未設定";

  return manager.employee_code
    ? `${manager.employee_code} / ${manager.name ?? ""}`
    : manager.name ?? "未設定";
}

function buildMissingItems(employee: EmployeeRow) {
  const items: string[] = [];

  if (!employee.birth_date) {
    items.push("生年月日");
  }

  if (normalizeGender(employee.gender) === "unknown") {
    items.push("性別");
  }

  if (!employee.manager_employee_id) {
    items.push("直属上司");
  }

  if (!employee.position_title) {
    items.push("現在役職");
  }

  return items;
}

function buildPositionHistorySummary(positionHistories: PositionHistoryRow[]) {
  const map = new Map<
    string,
    {
      total: number;
      promotions: number;
      demotions: number;
    }
  >();

  for (const history of positionHistories) {
    const current = map.get(history.employee_id) ?? {
      total: 0,
      promotions: 0,
      demotions: 0,
    };

    current.total += 1;

    if (history.change_type === "promotion") {
      current.promotions += 1;
    }

    if (history.change_type === "demotion") {
      current.demotions += 1;
    }

    map.set(history.employee_id, current);
  }

  return map;
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