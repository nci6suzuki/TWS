import Link from "next/link";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseServerDbClient } from "@/lib/supabase/server-db";
import { AnnualEventFilters } from "@/components/annual-events/annual-event-filters";
import { PageContainer, PageHeader, Section, EmptyState } from "@/components/ui/page";
import { Badge } from "@/components/ui/stat";
import { TableCard, Th, Td } from "@/components/ui/table";

export default async function AnnualEventsPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  await requireAuth();
  const supabase = await createSupabaseServerDbClient();

  const status = searchParams.status ?? "";
  const type = searchParams.type ?? "";
  const year = searchParams.year ?? "";
  const q = searchParams.q ?? "";
  const overdue = searchParams.overdue ?? "";

  const today = new Date().toISOString().slice(0, 10);

  // --- header counts ---
  const { count: pendingCount } = await supabase
    .from("employee_annual_events")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: overdueCount } = await supabase
    .from("employee_annual_events")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending")
    .lt("scheduled_date", today);

  // --- list query ---
  let query = supabase
    .from("employee_annual_events")
    .select("id, scheduled_date, title, event_type, status, priority")
    .order("scheduled_date", { ascending: true })
    .limit(200);

  if (status) query = query.eq("status", status);
  if (type) query = query.eq("event_type", type);
  if (q) query = query.ilike("title", `%${q}%`);

  if (/^\d{4}$/.test(year)) {
    query = query.gte("scheduled_date", `${year}-01-01`).lte("scheduled_date", `${year}-12-31`);
  }

  if (overdue === "1") {
    query = query.lt("scheduled_date", today).eq("status", "pending");
  }

  const { data, error } = await query;
  if (error) throw error;

  const meta = (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/annual-events?status=pending"
        className="hover:opacity-90"
      >
        <Badge>未完了 {pendingCount ?? 0}</Badge>
      </Link>
      <Link
        href="/annual-events?overdue=1"
        className="hover:opacity-90"
      >
        <Badge tone="danger">期限超過 {overdueCount ?? 0}</Badge>
      </Link>
      {status && <Badge>状態: {status}</Badge>}
      {type && <Badge>種別: {type}</Badge>}
      {/^\d{4}$/.test(year) && <Badge>年度: {year}</Badge>}
      {q && <Badge>検索: {q}</Badge>}
      {overdue === "1" && <Badge tone="danger">期限超過フィルタ</Badge>}
    </div>
  );

  return (
    <PageContainer>
      <PageHeader
        title="年間イベント"
        description="未完了・期限超過の可視化 → そのまま絞り込み。運用で迷わない一覧にします。"
        meta={meta}
        actions={
          <Link
            href="/annual-events/new"
            className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
          >
            + イベント登録
          </Link>
        }
      />

      <Section title="検索・絞り込み" description="条件をセットして一覧を更新します。">
        <AnnualEventFilters />
      </Section>

      <Section title="一覧" description="タイトルから詳細へ。編集・完了化は右側の操作から。">
        {(!data || data.length === 0) ? (
          <EmptyState
            title="該当するイベントがありません"
            description="条件をリセットするか、新規にイベントを登録してください。"
            action={
              <Link
                href="/annual-events/new"
                className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
              >
                + イベント登録
              </Link>
            }
          />
        ) : (
          <TableCard>
            <table className="min-w-[1100px] w-full text-sm">
              <thead>
                <tr className="border-b">
                  <Th>予定日</Th>
                  <Th>タイトル</Th>
                  <Th>種別</Th>
                  <Th>状態</Th>
                  <Th>優先度</Th>
                  <Th>操作</Th>
                </tr>
              </thead>
              <tbody>
                {data.map((e) => (
                  <tr key={e.id} className="border-b last:border-b-0">
                    <Td>{e.scheduled_date}</Td>
                    <Td>
                      <Link className="font-semibold text-indigo-600 hover:underline" href={`/annual-events/${e.id}`}>
                        {e.title}
                      </Link>
                    </Td>
                    <Td>{e.event_type}</Td>
                    <Td>{e.status}</Td>
                    <Td>{e.priority}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          className="inline-flex h-8 items-center rounded-lg border bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          href={`/annual-events/${e.id}`}
                        >
                          詳細
                        </Link>
                        <Link
                          className="inline-flex h-8 items-center rounded-lg border bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          href={`/annual-events/${e.id}/edit`}
                        >
                          編集
                        </Link>
                        <form action={`/api/annual-events/${e.id}/complete`} method="post">
                          <button
                            disabled={e.status === "done"}
                            className={[
                              "inline-flex h-8 items-center rounded-lg px-3 text-xs font-semibold text-white",
                              e.status === "done"
                                ? "bg-slate-400 cursor-not-allowed"
                                : "bg-slate-900 hover:bg-slate-800",
                            ].join(" ")}
                          >
                            完了化
                          </button>
                        </form>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        )}
      </Section>
    </PageContainer>
  );
}