// src/app/api/notifications/generate/route.ts

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type NotificationInsert = {
  employee_id: string;
  title: string;
  message: string;
  notification_type: string;
  severity: string;
  status: string;
  due_date: string | null;
  related_type: string;
  related_id: string;
  unique_key: string;
};

export async function POST() {
  try {
    const me = await requireAuth();

    if (me.role !== "admin" && me.role !== "hr") {
      return NextResponse.json(
        { success: false, message: "権限がありません" },
        { status: 403 }
      );
    }

    const admin = createSupabaseAdminClient();

    const today = new Date().toISOString().slice(0, 10);

    const alertDateObj = new Date();
    alertDateObj.setDate(alertDateObj.getDate() + 30);
    const alertDate = alertDateObj.toISOString().slice(0, 10);

    const sevenDaysLaterObj = new Date();
    sevenDaysLaterObj.setDate(sevenDaysLaterObj.getDate() + 7);
    const sevenDaysLater = sevenDaysLaterObj.toISOString().slice(0, 10);

    const { data: employees, error: employeesError } = await admin
      .from("employees")
      .select("id, employee_code, name, status")
      .eq("status", "active")
      .limit(1000);

    if (employeesError) throw employeesError;

    const employeeIds = (employees ?? []).map((e) => e.id);

    const employeeById = new Map(
      (employees ?? []).map((e) => [
        e.id,
        {
          employee_code: e.employee_code,
          name: e.name,
        },
      ])
    );

    const notifications: NotificationInsert[] = [];

    if (employeeIds.length > 0) {
      const { data: qualifications, error: qualificationsError } = await admin
        .from("employee_qualifications")
        .select("id, employee_id, qualification_name, expires_on, status")
        .in("employee_id", employeeIds);

      if (qualificationsError) throw qualificationsError;

      for (const q of qualifications ?? []) {
        if (!q.expires_on) continue;

        const employee = employeeById.get(q.employee_id);
        const employeeLabel = employee
          ? `${employee.employee_code} / ${employee.name}`
          : "対象社員";

        if (q.expires_on < today) {
          notifications.push({
            employee_id: q.employee_id,
            title: "資格期限切れ",
            message: `${employeeLabel} の「${q.qualification_name}」が期限切れです。期限日：${q.expires_on}`,
            notification_type: "qualification_expired",
            severity: "danger",
            status: "unread",
            due_date: q.expires_on,
            related_type: "employee_qualification",
            related_id: q.id,
            unique_key: `qualification_expired:${q.id}`,
          });
        } else if (q.expires_on <= alertDate) {
          notifications.push({
            employee_id: q.employee_id,
            title: "資格期限が近づいています",
            message: `${employeeLabel} の「${q.qualification_name}」が30日以内に期限を迎えます。期限日：${q.expires_on}`,
            notification_type: "qualification_expiring_soon",
            severity: "warning",
            status: "unread",
            due_date: q.expires_on,
            related_type: "employee_qualification",
            related_id: q.id,
            unique_key: `qualification_expiring_soon:${q.id}`,
          });
        }
      }

      const { data: events, error: eventsError } = await admin
        .from("employee_annual_events")
        .select(
          "id, employee_id, title, event_type, scheduled_date, status"
        )
        .in("employee_id", employeeIds)
        .eq("status", "pending");

      if (eventsError) throw eventsError;

      for (const event of events ?? []) {
        if (!event.scheduled_date) continue;

        const employee = employeeById.get(event.employee_id);
        const employeeLabel = employee
          ? `${employee.employee_code} / ${employee.name}`
          : "対象社員";

        if (event.scheduled_date < today) {
          notifications.push({
            employee_id: event.employee_id,
            title: "年間イベント期限超過",
            message: `${employeeLabel} の「${event.title}」が期限超過です。予定日：${event.scheduled_date}`,
            notification_type: "annual_event_overdue",
            severity: "danger",
            status: "unread",
            due_date: event.scheduled_date,
            related_type: "employee_annual_event",
            related_id: event.id,
            unique_key: `annual_event_overdue:${event.id}`,
          });
        } else if (event.scheduled_date <= sevenDaysLater) {
          notifications.push({
            employee_id: event.employee_id,
            title: "年間イベント予定が近づいています",
            message: `${employeeLabel} の「${event.title}」が7日以内に予定されています。予定日：${event.scheduled_date}`,
            notification_type: "annual_event_upcoming",
            severity: "info",
            status: "unread",
            due_date: event.scheduled_date,
            related_type: "employee_annual_event",
            related_id: event.id,
            unique_key: `annual_event_upcoming:${event.id}`,
          });
        }
      }
    }

    if (notifications.length > 0) {
      const { error: upsertError } = await admin
        .from("notifications")
        .upsert(notifications, {
          onConflict: "unique_key",
        });

      if (upsertError) throw upsertError;
    }

    return NextResponse.json({
      success: true,
      generated: notifications.length,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        message: e?.message ?? "通知生成に失敗しました",
      },
      { status: 500 }
    );
  }
}