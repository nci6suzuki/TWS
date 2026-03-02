// src/lib/queries/dashboard.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Me } from "@/types/api";

export async function getDashboardData({ me }: { me: Me }) {
  const supabase = createSupabaseServerClient();

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;

  const monthStart = `${yyyy}-${mm}-01`;

  const weekEndDate = new Date(today);
  weekEndDate.setDate(today.getDate() + 7);
  const weekEnd = formatDate(weekEndDate);

  // 1. 未実施フォロー
  const { count: pendingCount, error: pendingErr } = await supabase
    .from("followup_assignments")
    .select("*", { count: "exact", head: true })
    .in("status", ["pending", "in_progress"]);

  if (pendingErr) throw pendingErr;

  // 2. 期限超過
  const { count: overdueCount, error: overdueErr } = await supabase
    .from("followup_assignments")
    .select("*", { count: "exact", head: true })
    .lt("due_date", todayStr)
    .neq("status", "done");

  if (overdueErr) throw overdueErr;

  // 3. 今月の面談件数
  const { count: interviewCount, error: interviewErr } = await supabase
    .from("interview_records")
    .select("*", { count: "exact", head: true })
    .gte("interview_date", `${monthStart}T00:00:00.000Z`);

  if (interviewErr) throw interviewErr;

  // 4. 今週イベント件数
  const { count: weekEventCount, error: weekEventErr } = await supabase
    .from("employee_annual_events")
    .select("*", { count: "exact", head: true })
    .gte("scheduled_date", todayStr)
    .lte("scheduled_date", weekEnd);

  if (weekEventErr) throw weekEventErr;

  // 5. 直近期限フォロー
  const { data: dueFollowups, error: dueErr } = await supabase
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

  if (dueErr) throw dueErr;

  // 6. 期限超過一覧
  const { data: overdueFollowups, error: overdueListErr } = await supabase
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

  if (overdueListErr) throw overdueListErr;

  // 7. 今週イベント
  const { data: weeklyEvents, error: weeklyErr } = await supabase
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

  if (weeklyErr) throw weeklyErr;

  // 8. 通知
  const { data: notifications, error: notiErr } = await supabase
    .from("notifications")
    .select("id, type, title, body, is_read, created_at")
    .eq("user_employee_id", me.employeeId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (notiErr) throw notiErr;

  return {
    kpis: {
      interviewCount: interviewCount ?? 0,
      pendingFollowupCount: pendingCount ?? 0,
      overdueFollowupCount: overdueCount ?? 0,
      weekEventCount: weekEventCount ?? 0,
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