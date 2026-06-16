// src/app/api/annual-events/export/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll(`"`, `""`)}`;
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

  const status = url.searchParams.get("status") ?? "";
  const type = url.searchParams.get("type") ?? "";
  const year = url.searchParams.get("year") ?? "";
  const month = url.searchParams.get("month") ?? "";
  const q = url.searchParams.get("q") ?? "";
  const overdue = url.searchParams.get("overdue") ?? "";
  const employeeCode = url.searchParams.get("employeeCode") ?? "";
  const calendarYear = url.searchParams.get("calendarYear") ?? "";
  const calendarMonth = url.searchParams.get("calendarMonth") ?? "";

  const today = formatDate(new Date());
  const now = new Date();

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);

  let employeeIdFilter = "";

  if (employeeCode) {
    const { data: employeeForFilter, error: employeeError } = await admin
      .from("employees")
      .select("id")
      .eq("employee_code", employeeCode)
      .maybeSingle();

    if (employeeError) {
      return NextResponse.json(
        { success: false, message: employeeError.message },
        { status: 500 }
      );
    }

    employeeIdFilter =
      employeeForFilter?.id ?? "00000000-0000-0000-0000-000000000000";
  }

  let query = admin
    .from("employee_annual_events")
    .select(
      "id, employee_id, scheduled_date, title, event_type, status, priority, description, source_type, source_id, created_at"
    )
    .order("scheduled_date", { ascending: true })
    .limit(5000);

  if (employeeCode) {
    query = query.eq("employee_id", employeeIdFilter);
  }

  if (overdue === "1") {
    query = query.eq("status", "pending").lt("scheduled_date", today);
  } else if (status) {
    query = query.eq("status", status);
  }

  if (type) {
    query = query.eq("event_type", type);
  }

  if (q) {
    query = query.ilike("title", `%${q}%`);
  }

  if (/^\d{4}$/.test(year)) {
    query = query
      .gte("scheduled_date", `${year}-01-01`)
      .lte("scheduled_date", `${year}-12-31`);
  }

  if (month === "this") {
    query = query
      .gte("scheduled_date", formatDate(thisMonthStart))
      .lte("scheduled_date", formatDate(thisMonthEnd));
  }

  if (month === "next") {
    query = query
      .gte("scheduled_date", formatDate(nextMonthStart))
      .lte("scheduled_date", formatDate(nextMonthEnd));
  }

  if (
    /^\d{4}$/.test(calendarYear) &&
    /^\d{1,2}$/.test(calendarMonth) &&
    Number(calendarMonth) >= 1 &&
    Number(calendarMonth) <= 12 &&
    !month &&
    !year &&
    overdue !== "1"
  ) {
    const cy = Number(calendarYear);
    const cm = Number(calendarMonth);

    query = query
      .gte("scheduled_date", formatDate(new Date(cy, cm - 1, 1)))
      .lte("scheduled_date", formatDate(new Date(cy, cm, 0)));
  }

  const { data: events, error } = await query;

  if (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }

  const employeeIds = Array.from(
    new Set((events ?? []).map((e) => e.employee_id).filter(Boolean))
  );

  const { data: employees } =
    employeeIds.length > 0
      ? await admin
          .from("employees")
          .select("id, employee_code, name, email")
          .in("id", employeeIds)
      : { data: [] as any[] };

  const employeeById = new Map((employees ?? []).map((e: any) => [e.id, e]));

  const rows: unknown[][] = [
    [
      "予定日",
      "社員番号",
      "氏名",
      "メール",
      "タイトル",
      "種別",
      "状態",
      "優先度",
      "期限超過",
      "面談連動",
      "内容",
      "作成日時",
    ],
  ];

  for (const event of events ?? []) {
    const employee = employeeById.get(event.employee_id);
    const isOverdue =
      event.status === "pending" && event.scheduled_date < today;

    rows.push([
      event.scheduled_date,
      employee?.employee_code ?? "",
      employee?.name ?? "",
      employee?.email ?? "",
      event.title,
      getEventTypeLabel(event.event_type),
      getStatusLabel(event.status),
      getPriorityLabel(event.priority),
      isOverdue ? "期限超過" : "",
      event.source_type === "employee_interview" ? "面談連動" : "",
      event.description ?? "",
      event.created_at ?? "",
    ]);
  }

  const csv = "\uFEFF" + toCsv(rows);
  const filename = `annual_events_${today}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function getEventTypeLabel(type: string) {
  if (type === "interview") return "面談";
  if (type === "training") return "研修";
  if (type === "evaluation") return "評価";
  if (type === "qualification") return "資格";
  if (type === "contract") return "契約・更新";
  if (type === "onboarding") return "入社";
  if (type === "other") return "その他";
  return type || "その他";
}

function getStatusLabel(status: string) {
  if (status === "pending") return "未完了";
  if (status === "done") return "完了済み";
  if (status === "canceled") return "中止";
  return status || "";
}

function getPriorityLabel(priority: number | null) {
  if (priority === 1) return "高";
  if (priority === 2) return "通常";
  if (priority === 3) return "低";
  return priority ? String(priority) : "";
}