// src/app/(protected)/annual-events/page.tsx

import Link from "next/link";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseServerDbClient } from "@/lib/supabase/server-db";
import { AnnualEventFilters } from "@/components/annual-events/annual-event-filters";
import { DeleteAnnualEventButton } from "@/components/annual-events/delete-annual-event-button";
import {
  Hero,
  KPI,
  Chip,
  PrimaryButton,
  GhostButton,
  Card,
} from "@/components/ui/ux";
import { PageShell } from "@/components/ui/page-shell";

export const runtime = "nodejs";

type ViewMode = "cards" | "list";

export default async function AnnualEventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const me = await requireAuth();
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
  const employeeCode = getParam("employeeCode");
  const view = ((getParam("view") || "cards") as ViewMode) || "cards";

  const today = new Date().toISOString().slice(0, 10);

  let employeeIdFilter = "";
  let employeeFilterName = "";

  if (employeeCode) {
    const { data: employeeForFilter } = await supabase
      .from("employees")
      .select("id, employee_code, name")
      .eq("employee_code", employeeCode)
      .maybeSingle();

    employeeIdFilter =
      employeeForFilter?.id ?? "00000000-0000-0000-0000-000000000000";
    employeeFilterName = employeeForFilter?.name ?? "";
  }

  let query = supabase
    .from("employee_annual_events")
    .select(
      "id, employee_id, scheduled_date, title, event_type, status, priority, description, source_type, source_id"
    )
    .order("scheduled_date", { ascending: true })
    .limit(200);

  if (employeeCode) query = query.eq("employee_id", employeeIdFilter);

  if (overdue === "1") {
    query = query.eq("status", "pending").lt("scheduled_date", today);
  } else {
    if (status) query = query.eq("status", status);
  }

  if (type) query = query.eq("event_type", type);
  if (q) query = query.ilike("title", `%${q}%`);

  if (/^\d{4}$/.test(year)) {
    query = query
      .gte("scheduled_date", `${year}-01-01`)
      .lte("scheduled_date", `${year}-12-31`);
  }

  const { data, error } = await query;
  if (error) throw error;

  const events = data ?? [];
  const eventEmployeeIds = Array.from(
    new Set(events.map((e) => e.employee_id).filter(Boolean))
  );

  const { data: eventEmployees } =
    eventEmployeeIds.length > 0
      ? await supabase
          .from("employees")
          .select("id, employee_code, name")
          .in("id", eventEmployeeIds)
      : { data: [] as any[] };

  const employeeById = new Map(
    (eventEmployees ?? []).map((e: any) => [e.id, e])
  );

  const visiblePendingCount = events.filter(
    (e) => e.status === "pending"
  ).length;

  const visibleOverdueCount = events.filter(
    (e) => e.status === "pending" && e.scheduled_date < today
  ).length;

  const visibleDoneCount = events.filter((e) => e.status === "done").length;

  const baseParams = new URLSearchParams();

  if (status) baseParams.set("status", status);
  if (type) baseParams.set("type", type);
  if (year) baseParams.set("year", year);
  if (q) baseParams.set("q", q);
  if (overdue) baseParams.set("overdue", overdue);
  if (employeeCode) baseParams.set("employeeCode", employeeCode);

  const toView = (v: ViewMode) => {
    const p = new URLSearchParams(baseParams);
    p.set("view", v);
    return `/annual-events?${p.toString()}`;
  };

  const currentReturnToParams = new URLSearchParams(baseParams);
  currentReturnToParams.set("view", view);
  const currentReturnTo = `/annual-events?${currentReturnToParams.toString()}`;

  return (
    <PageShell>
      <div className="space-y-6">
        <Hero
          title="年間イベント"
          subtitle="未完了・期限超過を可視化し、検索から処理まで一画面で確認できます。"
          meta={
            <div className="flex flex-wrap gap-2">
              <Chip tone="info">Annual Events</Chip>
              <Chip>表示形式: {view}</Chip>
              <Chip>表示件数: {events.length}</Chip>
              <Chip>ログイン権限: {me.role}</Chip>

              {status && overdue !== "1" && <Chip>状態: {status}</Chip>}
              {type && <Chip>種別: {type}</Chip>}
              {/^\d{4}$/.test(year) && <Chip>年度: {year}</Chip>}
              {q && <Chip>検索: {q}</Chip>}

              {employeeCode && (
                <Chip tone="info">
                  社員: {employeeCode}
                  {employeeFilterName ? ` / ${employeeFilterName}` : ""}
                </Chip>
              )}

              {overdue === "1" && (
                <Chip tone="danger">期限超過のみ表示中</Chip>
              )}
            </div>
          }
          right={
            <>
              <PrimaryButton href="/annual-events">全イベント</PrimaryButton>
              <PrimaryButton href="/annual-events?overdue=1">
                期限超過のみ
              </PrimaryButton>
              <GhostButton href={toView("cards")}>Cards</GhostButton>
              <GhostButton href={toView("list")}>List</GhostButton>
              {(me.role === "admin" || me.role === "hr") && (
                <PrimaryButton href="/annual-events/new">
                  + イベント登録
                </PrimaryButton>
              )}
            </>
          }
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <KPI label="表示件数" value={events.length} />
          <KPI
            label="未完了"
            value={visiblePendingCount}
            tone={visiblePendingCount > 0 ? "danger" : "ok"}
          />
          <KPI
            label="期限超過"
            value={visibleOverdueCount}
            tone={visibleOverdueCount > 0 ? "danger" : "ok"}
            href="/annual-events?overdue=1"
          />
          <KPI label="完了済み" value={visibleDoneCount} tone="ok" />
        </div>

        <Card className="p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-black text-slate-900">
                検索・絞り込み
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                状態、種別、年度、キーワードで年間イベントを絞り込めます。
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Chip tone={overdue === "1" ? "danger" : "gray"}>
                {overdue === "1" ? "期限超過のみ" : "全イベント"}
              </Chip>
              <Chip tone={view === "cards" ? "info" : "gray"}>
                {view === "cards" ? "カード表示" : "リスト表示"}
              </Chip>
            </div>
          </div>

          <div className="mt-4">
            <AnnualEventFilters />
          </div>
        </Card>

        {view === "cards" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {events.length === 0 ? (
              <Card className="p-8 md:col-span-2 xl:col-span-3">
                <div className="text-center text-sm font-bold text-slate-500">
                  表示できる年間イベントがありません
                </div>
              </Card>
            ) : (
              events.map((e) => {
                const isOverdue =
                  e.status === "pending" && e.scheduled_date < today;
                const employee = employeeById.get(e.employee_id);

                return (
                  <div
                    key={e.id}
                    className={[
                      "rounded-3xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                      isOverdue
                        ? "border-rose-200 bg-rose-50"
                        : "border-slate-200 bg-white",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-black tracking-[0.12em] text-slate-400">
                          {e.scheduled_date} / {getEventTypeLabel(e.event_type)}
                        </div>

                        <Link
                          className="mt-2 block text-lg font-black text-slate-900 hover:underline"
                          href={`/annual-events/${e.id}`}
                        >
                          {e.title}
                        </Link>

                        {employee && (
                          <Link
                            href={`/employees/code/${employee.employee_code}?tab=schedule`}
                            className="mt-2 inline-flex text-xs font-black text-indigo-600 hover:underline"
                          >
                            {employee.employee_code} / {employee.name}
                          </Link>
                        )}

                        {e.description && (
                          <div className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm font-semibold text-slate-600">
                            {e.description}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Chip
                          tone={
                            e.status === "done"
                              ? "ok"
                              : isOverdue
                              ? "danger"
                              : "gray"
                          }
                        >
                          {isOverdue ? "期限超過" : e.status}
                        </Chip>

                        {e.source_type === "employee_interview" && (
                          <Chip tone="info">面談連動</Chip>
                        )}

                        <Chip>優先度 {e.priority}</Chip>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 hover:bg-slate-50"
                        href={`/annual-events/${e.id}`}
                      >
                        詳細
                      </Link>

                      <Link
                        className="inline-flex h-9 items-center rounded-xl bg-slate-900 px-3 text-sm font-black text-white hover:bg-slate-800"
                        href={`/annual-events/${e.id}/edit`}
                      >
                        編集
                      </Link>

                      {e.status !== "done" ? (
                        <form
                          action={`/api/annual-events/${e.id}/complete`}
                          method="post"
                        >
                          <input
                            type="hidden"
                            name="returnTo"
                            value={currentReturnTo}
                          />
                          <button
                            type="submit"
                            className="inline-flex h-9 items-center rounded-xl bg-emerald-600 px-3 text-sm font-black text-white hover:bg-emerald-700"
                          >
                            完了化
                          </button>
                        </form>
                      ) : (
                        <span className="inline-flex h-9 items-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-black text-emerald-700">
                          完了済み
                        </span>
                      )}

                      <DeleteAnnualEventButton
                        eventId={e.id}
                        returnTo={currentReturnTo}
                        size="md"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <Card className="overflow-auto p-0">
            <table className="min-w-[1200px] w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b text-slate-500">
                  <th className="px-4 py-3 text-left font-black">予定日</th>
                  <th className="px-4 py-3 text-left font-black">社員</th>
                  <th className="px-4 py-3 text-left font-black">タイトル</th>
                  <th className="px-4 py-3 text-left font-black">種別</th>
                  <th className="px-4 py-3 text-left font-black">状態</th>
                  <th className="px-4 py-3 text-left font-black">優先度</th>
                  <th className="px-4 py-3 text-left font-black">連動</th>
                  <th className="px-4 py-3 text-left font-black">操作</th>
                </tr>
              </thead>

              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      表示できる年間イベントがありません
                    </td>
                  </tr>
                ) : (
                  events.map((e) => {
                    const isOverdue =
                      e.status === "pending" && e.scheduled_date < today;
                    const employee = employeeById.get(e.employee_id);

                    return (
                      <tr
                        key={e.id}
                        className={[
                          "border-b last:border-b-0 hover:bg-slate-50",
                          isOverdue ? "bg-rose-50" : "bg-white",
                        ].join(" ")}
                      >
                        <td className="px-4 py-3 font-bold text-slate-700">
                          {e.scheduled_date}
                        </td>

                        <td className="px-4 py-3">
                          {employee ? (
                            <Link
                              href={`/employees/code/${employee.employee_code}?tab=schedule`}
                              className="font-black text-indigo-600 hover:underline"
                            >
                              {employee.employee_code} / {employee.name}
                            </Link>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <Link
                            href={`/annual-events/${e.id}`}
                            className="font-black text-slate-900 hover:underline"
                          >
                            {e.title}
                          </Link>
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          {getEventTypeLabel(e.event_type)}
                        </td>

                        <td className="px-4 py-3">
                          <Chip
                            tone={
                              e.status === "done"
                                ? "ok"
                                : isOverdue
                                ? "danger"
                                : "gray"
                            }
                          >
                            {isOverdue ? "期限超過" : e.status}
                          </Chip>
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          {e.priority}
                        </td>

                        <td className="px-4 py-3">
                          {e.source_type === "employee_interview" ? (
                            <Chip tone="info">面談連動</Chip>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:bg-slate-50"
                              href={`/annual-events/${e.id}`}
                            >
                              詳細
                            </Link>

                            <Link
                              className="inline-flex h-8 items-center rounded-lg bg-slate-900 px-3 text-xs font-black text-white hover:bg-slate-800"
                              href={`/annual-events/${e.id}/edit`}
                            >
                              編集
                            </Link>

                            {e.status !== "done" ? (
                              <form
                                action={`/api/annual-events/${e.id}/complete`}
                                method="post"
                              >
                                <input
                                  type="hidden"
                                  name="returnTo"
                                  value={currentReturnTo}
                                />
                                <button
                                  type="submit"
                                  className="inline-flex h-8 items-center rounded-lg bg-emerald-600 px-3 text-xs font-black text-white hover:bg-emerald-700"
                                >
                                  完了化
                                </button>
                              </form>
                            ) : (
                              <span className="inline-flex h-8 items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-black text-emerald-700">
                                完了済み
                              </span>
                            )}

                            <DeleteAnnualEventButton
                              eventId={e.id}
                              returnTo={currentReturnTo}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </PageShell>
  );
}

function getEventTypeLabel(type: string) {
  if (type === "interview") return "面談";
  if (type === "training") return "研修";
  if (type === "evaluation") return "評価";
  if (type === "qualification") return "資格";
  if (type === "contract") return "契約・更新";
  if (type === "other") return "その他";
  return type || "その他";
}