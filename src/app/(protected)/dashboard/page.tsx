import { PageContainer, PageHeader, Section } from "@/components/ui/page";
import { StatCard } from "@/components/ui/stat";
import { createSupabaseServerDbClient } from "@/lib/supabase/server-db";
import { requireAuth } from "@/lib/auth/require-auth";

export default async function DashboardPage() {
  await requireAuth();
  const supabase = await createSupabaseServerDbClient();
  const today = new Date().toISOString().slice(0, 10);

  const { count: pending } = await supabase.from("employee_annual_events").select("id", { count: "exact", head: true }).eq("status", "pending");
  const { count: overdue } = await supabase.from("employee_annual_events").select("id", { count: "exact", head: true }).eq("status", "pending").lt("scheduled_date", today);

  return (
    <PageContainer>
      <PageHeader title="ダッシュボード" description="未完了・期限超過を最短で把握できます。" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="未完了" value={pending ?? 0} href="/annual-events?status=pending" />
        <StatCard label="期限超過" value={overdue ?? 0} href="/annual-events?overdue=1" tone="danger" />
      </div>

      <Section title="ショートカット">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a className="rounded-2xl border bg-white p-5 hover:bg-slate-50" href="/employees">社員一覧</a>
          <a className="rounded-2xl border bg-white p-5 hover:bg-slate-50" href="/annual-events">年間イベント</a>
        </div>
      </Section>
    </PageContainer>
  );
}