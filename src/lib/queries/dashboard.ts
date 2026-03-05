// src/lib/queries/dashboard.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Me } from "@/types/api";

export async function getDashboardData({ me }: { me: Me }) {
  const supabase = await createSupabaseServerClient();

  const today = new Date();
  const todayStr = formatDate(today);

  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;

  const weekEndDate = new Date(today);
  weekEndDate.setDate(today.getDate() + 7);
  const weekEnd = formatDate(weekEndDate);

  const day30 = new Date(today);
  day30.setDate(today.getDate() + 30);
  const day90 = new Date(today);
  day90.setDate(today.getDate() + 90);

  const day30Str = formatDate(day30);
  const day90Str = formatDate(day90);

  const { count: pendingCount } = await supabase
    .from("followup_assignments")
    .select("*", { count: "exact", head: true })
    .in("status", ["pending", "in_progress"]);

  const { count: overdueCount } = await supabase
    .from("followup_assignments")
    .select("*", { count: "exact", head: true })
    .lt("due_date", todayStr)
    .neq("status", "done");

  const { count: interviewCount } = await supabase
    .from("interview_records")
    .select("*", { count: "exact", head: true })
    .gte("interview_date", `${monthStart}T00:00:00.000Z`);

  const { count: weekEventCount } = await supabase
    .from("employee_annual_events")
    .select("*", { count: "exact", head: true })
    .gte("scheduled_date", todayStr)
    .lte("scheduled_date", weekEnd);

  const { data: dueFollowups } = await supabase
    .from("followup_assignments")
    .select(`
      id,
      due_date,
      status,
      followup_type,
      employees:employee_id ( id, name ),
      assignee:assignee_employee_id ( id, name )
    `)
    .neq("status", "done")
    .order("due_date", { ascending: true })
    .limit(5);

  const { data: overdueFollowups } = await supabase
    .from("followup_assignments")
    .select(`
      id,
      due_date,
      status,
      followup_type,
      employees:employee_id ( id, name ),
      assignee:assignee_employee_id ( id, name )
    `)
    .lt("due_date", todayStr)
    .neq("status", "done")
    .order("due_date", { ascending: true })
    .limit(5);

  const { data: weeklyEvents } = await supabase
    .from("employee_annual_events")
    .select(`
      id,
      title,
      event_type,
      scheduled_date,
      status,
      employees:employee_id ( id, name )
    `)
    .gte("scheduled_date", todayStr)
    .lte("scheduled_date", weekEnd)
    .order("scheduled_date", { ascending: true })
    .limit(10);

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, type, title, body, is_read, created_at")
    .eq("user_employee_id", me.employeeId)
    .order("created_at", { ascending: false })
    .limit(5);

  // 資格期限
  const { count: qualification30Count } = await supabase
    .from("employee_qualifications")
    .select("*", { count: "exact", head: true })
    .gte("expires_on", todayStr)
    .lte("expires_on", day30Str);

  const { count: qualification90Count } = await supabase
    .from("employee_qualifications")
    .select("*", { count: "exact", head: true })
    .gte("expires_on", todayStr)
    .lte("expires_on", day90Str);

  const { count: qualificationExpiredCount } = await supabase
    .from("employee_qualifications")
    .select("*", { count: "exact", head: true })
    .lt("expires_on", todayStr);

  const { data: qualificationAlerts } = await supabase
    .from("employee_qualifications")
    .select(`
      id,
      expires_on,
      status,
      employees:employee_id ( id, name ),
      qualification_master:qualification_id ( id, name )
    `)
    .not("expires_on", "is", null)
    .lte("expires_on", day90Str)
    .order("expires_on", { ascending: true })
    .limit(10);

  return {
    kpis: {
      interviewCount: interviewCount ?? 0,
      pendingFollowupCount: pendingCount ?? 0,
      overdueFollowupCount: overdueCount ?? 0,
      weekEventCount: weekEventCount ?? 0,
      qualification30Count: qualification30Count ?? 0,
      qualification90Count: qualification90Count ?? 0,
      qualificationExpiredCount: qualificationExpiredCount ?? 0,
    },
    dueFollowups: (dueFollowups ?? []).map(mapFollowupRow),
    overdueFollowups: (overdueFollowups ?? []).map(mapFollowupRow),
    weeklyEvents: (weeklyEvents ?? []).map((row: any) => ({
      id: row.id,
      title: row.title,
      eventType: row.event_type,
      scheduledDate: row.scheduled_date,
      status: row.status,
      employeeName: row.employees?.name ?? "",
    })),
    notifications: (notifications ?? []).map((row: any) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      isRead: row.is_read,
      createdAt: row.created_at,
    })),
    qualificationAlerts: (qualificationAlerts ?? []).map((row: any) => ({
      id: row.id,
      expiresOn: row.expires_on,
      status: row.status,
      employeeName: row.employees?.name ?? "",
      qualificationName: row.qualification_master?.name ?? "",
    })),
  };
}

function mapFollowupRow(row: any) {
  return {
    id: row.id,
    dueDate: row.due_date,
    status: row.status,
    followupType: row.followup_type,
    employeeName: row.employees?.name ?? "",
    assigneeName: row.assignee?.name ?? "",
  };
}

function formatDate(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}