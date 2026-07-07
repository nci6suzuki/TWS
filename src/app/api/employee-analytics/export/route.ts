// src/app/api/employee-analytics/export/route.ts

import { NextResponse } from "next/server";
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
};

export async function GET() {
  const me = await requireAuth();

  if (me.role !== "admin" && me.role !== "hr" && me.role !== "manager") {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 403 }
    );
  }

  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("employees")
    .select(
      "id, employee_code, name, email, app_role, status, employment_type, hire_date, birth_date, gender, is_management_role"
    )
    .order("employee_code", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  const employees = (data ?? []) as EmployeeRow[];

  const rows = employees.map((e) => {
    const age = calcAge(e.birth_date);

    return [
      e.employee_code ?? "",
      e.name ?? "",
      e.email ?? "",
      getStatusLabel(e.status),
      getEmploymentLabel(e.employment_type),
      e.app_role ?? "",
      e.hire_date ?? "",
      e.birth_date ?? "",
      age === null ? "" : String(age),
      getGenderLabel(e.gender),
      e.is_management_role ? "対象" : "対象外",
    ];
  });

  const header = [
    "社員番号",
    "氏名",
    "メール",
    "在籍状態",
    "雇用区分",
    "システムロール",
    "入社日",
    "生年月日",
    "年齢",
    "性別",
    "役職者",
  ];

  const csv = [
    header.map(csvEscape).join(","),
    ...rows.map((row) => row.map(csvEscape).join(",")),
  ].join("\r\n");

  const bom = "\uFEFF";

  return new NextResponse(bom + csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="employee-analytics.csv"`,
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
  if (value === "未設定") return "未設定";

  return value || "未設定";
}

function getStatusLabel(value: string | null) {
  if (value === "active") return "在籍中";
  if (value === "leave") return "休職中";
  if (value === "inactive") return "退職・無効";

  return value || "未設定";
}