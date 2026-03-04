// src/app/(protected)/notifications/page.tsx
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NotificationList } from "@/components/notifications/notification-list";

export default async function NotificationsPage() {
  const me = await requireAuth();
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, is_read, created_at, related_table, related_id")
    .eq("user_employee_id", me.employeeId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">通知一覧</h1>
      <NotificationList items={data ?? []} />
    </div>
  );
}