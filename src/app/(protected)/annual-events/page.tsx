import Link from "next/link";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseServerDbClient } from "@/lib/supabase/server-db";
import { AnnualEventFilters } from "@/components/annual-events/annual-event-filters";
import { Hero, KPI, Chip, PrimaryButton, GhostButton, Card } from "@/components/ui/ux";
import { PageShell } from "@/components/ui/page-shell";

export default async function AnnualEventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  await requireAuth();
  const supabase = await createSupabaseServerDbClient();

  const getParam = (key: string) => {
    const v = sp[key];
    return Array.isArray(v) ? v[0] ?? "" : v ?? "";
  };

  const status = getParam("status");
  const type = getParam("type");
  const year = getParam("year");
  const q = getParam("q");
  const overdue = getParam("overdue");
  const view = (getParam("view") || "cards") as "cards" | "list";

  const today = new Date().toISOString().slice(0, 10);

  // KPI
  const { count: pendingCount } = await supabase
    .from("employee_annual_events")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: overdueCount } = await supabase
    .from("employee_annual_events")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending")
    .lt("scheduled_date", today);

  // list query
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

  // URL保持しつつ view 切替
  const baseParams = new URLSearchParams();
  if (status) baseParams.set("status", status);
  if (type) baseParams.set("type", type);
  if (year) baseParams.set("year", year);
  if (q) baseParams.set("q", q);
  if (overdue) baseParams.set("overdue", overdue);

  const toView = (v: "cards" | "list") => {
    const p = new URLSearchParams(baseParams);
    p.set("view", v);
    return `/annual-events?${p.toString()}`;
  };

  return (
<PageShell>
  <main className="min-h-screen bg-slate-50">
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-8 md:py-10">
      <Hero
        title="年間イベント"
        subtitle="未完了・期限超過を可視化し、検索→処理まで一画面で完結します。"
        meta={
          <div className="flex flex-wrap gap-2">
            <Chip tone="info">view: {view}</Chip>
            {status && <Chip>状態: {status}</Chip>}
            {type && <Chip>種別: {type}</Chip>}
            {/^\d{4}$/.test(year) && <Chip>年度: {year}</Chip>}
            {q && <Chip>検索: {q}</Chip>}
            {overdue === "1" && <Chip tone="danger">期限超過フィルタ</Chip>}
          </div>
        }
        right={
          <>
            <GhostButton href={toView("cards")}>Cards</GhostButton>
            <GhostButton href={toView("list")}>List</GhostButton>
            <PrimaryButton href="/annual-events/new">+ イベント登録</PrimaryButton>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <KPI label="未完了" value={pendingCount ?? 0} href="/annual-events?status=pending&view=cards" />
        <KPI label="期限超過" value={overdueCount ?? 0} tone="danger" href="/annual-events?overdue=1&view=cards" />
        <KPI label="表示件数" value={data?.length ?? 0} tone="ok" />
      </div>

      <Card className="p-5">
        <div className="text-sm font-bold text-slate-900">検索・絞り込み</div>
        <div className="mt-3">
          <AnnualEventFilters />
        </div>
      </Card>

      {view === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(data ?? []).map((e) => {
            const isOverdue = e.status === "pending" && e.scheduled_date < today;

            return (
              <div
                key={e.id}
                className={[
                  "rounded-3xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                  isOverdue
                  ? "border-rose-200 bg-rose-50"
                  : "border-slate-200 hover:bg-white",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold tracking-[0.12em] text-slate-400">
                      {e.scheduled_date} / {e.event_type}
                    </div>
                    <Link
                      className="mt-2 block text-lg font-extrabold text-slate-900 hover:underline"
                      href={`/annual-events/${e.id}`}
                    >
                      {e.title}
                    </Link>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Chip tone={e.status === "done" ? "ok" : isOverdue ? "danger" : "gray"}>
                      {isOverdue ? "期限超過" : e.status}
                    </Chip>
                    <Chip>優先度 {e.priority}</Chip>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    href={`/annual-events/${e.id}`}
                  >
                    詳細
                  </Link>
                  <Link
                    className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    href={`/annual-events/${e.id}/edit`}
                  >
                    編集
                  </Link>
                  <form action={`/api/annual-events/${e.id}/complete`} method="post">
                    <button
                      disabled={e.status === "done"}
                      className={[
                        "inline-flex h-9 items-center rounded-xl px-3 text-sm font-semibold text-white",
                        e.status === "done" ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:bg-slate-800",
                      ].join(" ")}
                    >
                      完了化
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="p-0 overflow-auto">
          <table className="min-w-[1100px] w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b text-slate-500">
                <th className="py-3 px-4 text-left">予定日</th>
                <th className="py-3 px-4 text-left">タイトル</th>
                <th className="py-3 px-4 text-left">種別</th>
                <th className="py-3 px-4 text-left">状態</th>
                <th className="py-3 px-4 text-left">優先度</th>
                <th className="py-3 px-4 text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((e) => {
                const isOverdue = e.status === "pending" && e.scheduled_date < today;
                return (
                  <tr key={e.id} className="border-b last:border-b-0 hover:bg-slate-50">
                    <td className="py-3 px-4">{e.scheduled_date}</td>
                    <td className="py-3 px-4 font-semibold">
                      <Link className="text-indigo-600 hover:underline" href={`/annual-events/${e.id}`}>
                        {e.title}
                      </Link>
                      {isOverdue && (
                        <span className="ml-2">
                          <Chip tone="danger">期限超過</Chip>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">{e.event_type}</td>
                    <td className="py-3 px-4">{e.status}</td>
                    <td className="py-3 px-4">{e.priority}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          href={`/annual-events/${e.id}`}
                        >
                          詳細
                        </Link>
                        <Link
                          className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          href={`/annual-events/${e.id}/edit`}
                        >
                          編集
                        </Link>
                        <form action={`/api/annual-events/${e.id}/complete`} method="post">
                          <button
                            disabled={e.status === "done"}
                            className={[
                              "inline-flex h-8 items-center rounded-lg px-3 text-xs font-semibold text-white",
                              e.status === "done" ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:bg-slate-800",
                            ].join(" ")}
                          >
                            完了化
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  </main>
  </PageShell>
);
}