// src/app/(protected)/annual-events/page.tsx

import Link from "next/link";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseServerDbClient } from "@/lib/supabase/server-db";
import { AnnualEventFilters } from "@/components/annual-events/annual-event-filters";
import { DeleteAnnualEventButton } from "@/components/annual-events/delete-annual-event-button";
import { AnnualEventCalendar } from "@/components/annual-events/annual-event-calendar";
import {
  Hero,
  KPI,
  Chip,
  PrimaryButton,
  GhostButton,
  Card,
} from "@/components/ui/ux";
import { PageShell } from "@/components/ui/page-shell";
import { buttonClassName } from "@/lib/ui/button-class";
import { CompleteAnnualEventButton } from "@/components/annual-events/complete-annual-event-button";

export const runtime = "nodejs";

type ViewMode = "cards" | "list" | "calendar";

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
  const month = getParam("month");
  const q = getParam("q");
  const overdue = getParam("overdue");
  const employeeCode = getParam("employeeCode");
  const calendarYearParam = getParam("calendarYear");
  const calendarMonthParam = getParam("calendarMonth");
  const view = ((getParam("view") || "cards") as ViewMode) || "cards";

  const now = new Date();
  const today = formatDate(now);

  const targetYear = /^\d{4}$/.test(calendarYearParam)
    ? Number(calendarYearParam)
    : now.getFullYear();

  const targetMonth =
    /^\d{1,2}$/.test(calendarMonthParam) &&
    Number(calendarMonthParam) >= 1 &&
    Number(calendarMonthParam) <= 12
      ? Number(calendarMonthParam)
      : now.getMonth() + 1;

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);

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
    .limit(500);

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

  if (view === "calendar" && !month && !year && overdue !== "1") {
    const calendarStart = formatDate(new Date(targetYear, targetMonth - 1, 1));
    const calendarEnd = formatDate(new Date(targetYear, targetMonth, 0));

    query = query
      .gte("scheduled_date", calendarStart)
      .lte("scheduled_date", calendarEnd);
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
  if (month) baseParams.set("month", month);
  if (q) baseParams.set("q", q);
  if (overdue) baseParams.set("overdue", overdue);
  if (employeeCode) baseParams.set("employeeCode", employeeCode);
  if (calendarYearParam) baseParams.set("calendarYear", calendarYearParam);
  if (calendarMonthParam) baseParams.set("calendarMonth", calendarMonthParam);

  const exportParams = new URLSearchParams(baseParams);
  const exportHref = `/api/annual-events/export${
    exportParams.toString() ? `?${exportParams.toString()}` : ""
  }`;

  const toView = (v: ViewMode) => {
    const p = new URLSearchParams(baseParams);
    p.set("view", v);

    if (v === "calendar" && !p.get("calendarYear")) {
      p.set("calendarYear", String(targetYear));
      p.set("calendarMonth", String(targetMonth));
    }

    return `/annual-events?${p.toString()}`;
  };

  const filterHref = (params: Record<string, string>) => {
    const p = new URLSearchParams();

    if (employeeCode) p.set("employeeCode", employeeCode);
    if (view) p.set("view", view);

    if (view === "calendar") {
      p.set("calendarYear", String(targetYear));
      p.set("calendarMonth", String(targetMonth));
    }

    Object.entries(params).forEach(([key, value]) => {
      if (value) p.set(key, value);
    });

    return `/annual-events?${p.toString()}`;
  };

  const currentReturnToParams = new URLSearchParams(baseParams);
  currentReturnToParams.set("view", view);

  const currentReturnTo = `/annual-events?${currentReturnToParams.toString()}`;
  const currentBasePath = `/annual-events?${currentReturnToParams.toString()}`;

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
              {month === "this" && <Chip tone="info">今月のみ表示中</Chip>}
              {month === "next" && <Chip tone="info">来月のみ表示中</Chip>}

              {view === "calendar" && (
                <Chip tone="info">
                  カレンダー: {targetYear}年{targetMonth}月
                </Chip>
              )}

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

              <GhostButton href={filterHref({ month: "this" })}>
                今月
              </GhostButton>

              <GhostButton href={filterHref({ month: "next" })}>
                来月
              </GhostButton>

              <GhostButton href={filterHref({ status: "pending" })}>
                未完了
              </GhostButton>

              <GhostButton href={filterHref({ status: "done" })}>
                完了済み
              </GhostButton>

              <PrimaryButton href={filterHref({ overdue: "1" })}>
                期限超過
              </PrimaryButton>

              <GhostButton href={toView("cards")}>Cards</GhostButton>
              <GhostButton href={toView("list")}>List</GhostButton>
              <GhostButton href={toView("calendar")}>Calendar</GhostButton>

              {(me.role === "admin" || me.role === "hr") && (
                <>
                  <PrimaryButton href={exportHref}>CSV出力</PrimaryButton>
                  <PrimaryButton href="/annual-events/new">
                    + イベント登録
                  </PrimaryButton>
                </>
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
            href={filterHref({ status: "pending" })}
          />

          <KPI
            label="期限超過"
            value={visibleOverdueCount}
            tone={visibleOverdueCount > 0 ? "danger" : "ok"}
            href={filterHref({ overdue: "1" })}
          />

          <KPI
            label="完了済み"
            value={visibleDoneCount}
            tone="ok"
            href={filterHref({ status: "done" })}
          />
        </div>

        {visibleOverdueCount > 0 && (
          <Card className="border-rose-200 bg-rose-50 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-black text-rose-700">
                  期限超過イベントがあります
                </div>
                <div className="mt-1 text-sm font-semibold text-rose-600">
                  未完了のまま予定日を過ぎているイベントが {visibleOverdueCount} 件あります。
                </div>
              </div>

              <Link
                href={filterHref({ overdue: "1" })}
                className={buttonClassName(
                  "inline-flex h-10 items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-black text-white hover:bg-rose-700"
                )}
              >
                期限超過のみ確認
              </Link>
            </div>
          </Card>
        )}

        <Card className="p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-black text-slate-900">
                検索・絞り込み
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                状態、種別、年度、月、キーワードで年間イベントを絞り込めます。
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Chip tone={overdue === "1" ? "danger" : "gray"}>
                {overdue === "1" ? "期限超過のみ" : "全イベント"}
              </Chip>

              <Chip tone={month ? "info" : "gray"}>
                {month === "this"
                  ? "今月"
                  : month === "next"
                    ? "来月"
                    : "月指定なし"}
              </Chip>

              <Chip tone={status ? "info" : "gray"}>
                {status === "pending"
                  ? "未完了"
                  : status === "done"
                    ? "完了済み"
                    : status || "状態指定なし"}
              </Chip>

              <Chip tone={view === "calendar" ? "info" : "gray"}>
                {view === "calendar"
                  ? "カレンダー表示"
                  : view === "cards"
                    ? "カード表示"
                    : "リスト表示"}
              </Chip>
            </div>
          </div>

          <div className="mt-4">
            <AnnualEventFilters />
          </div>
        </Card>

        {view === "calendar" ? (
          <AnnualEventCalendar
            events={events}
            employeeById={employeeById}
            today={today}
            targetYear={targetYear}
            targetMonth={targetMonth}
            basePath={currentBasePath}
            employeeCode={employeeCode}
          />
        ) : view === "cards" ? (
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
                      "group rounded-3xl border p-5 shadow-sm",
                      "transition duration-150 ease-out",
                      "hover:-translate-y-0.5 hover:shadow-md",
                      "active:scale-[0.99] active:translate-y-px",
                      isOverdue
                        ? "border-rose-200 bg-rose-50 hover:border-rose-300"
                        : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-black tracking-[0.12em] text-slate-400">
                          {e.scheduled_date} / {getEventTypeLabel(e.event_type)}
                        </div>

                        <Link
                          className="mt-2 block truncate text-lg font-black text-slate-900 hover:text-indigo-700 hover:underline"
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

                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <Chip
                          tone={
                            e.status === "done"
                              ? "ok"
                              : isOverdue
                                ? "danger"
                                : "gray"
                          }
                        >
                          {isOverdue ? "期限超過" : getStatusLabel(e.status)}
                        </Chip>

                        {e.source_type === "employee_interview" && (
                          <Chip tone="info">面談連動</Chip>
                        )}

                        <Chip>優先度 {e.priority}</Chip>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        className={buttonClassName(
                          "inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 hover:bg-slate-50"
                        )}
                        href={`/annual-events/${e.id}`}
                      >
                        詳細
                      </Link>

                      <Link
                        className={buttonClassName(
                          "inline-flex h-9 items-center rounded-xl bg-slate-900 px-3 text-sm font-black text-white hover:bg-slate-800"
                        )}
                        href={`/annual-events/${e.id}/edit`}
                      >
                        編集
                      </Link>

                      {e.status !== "done" ? (
                        <CompleteAnnualEventButton
                        eventId={e.id}
                        returnTo={currentReturnTo}
                        size="md"
                        />
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
            <table className="w-full min-w-[1200px] text-sm">
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
                          "group border-b transition last:border-b-0",
                          isOverdue
                            ? "bg-rose-50 hover:bg-rose-100/70"
                            : "bg-white hover:bg-indigo-50/40",
                        ].join(" ")}
                      >
                        <td className="px-4 py-3 font-bold text-slate-700">
                          {e.scheduled_date}
                        </td>

                        <td className="px-4 py-3">
                          {employee ? (
                            <Link
                              href={`/employees/code/${employee.employee_code}?tab=schedule`}
                              className={buttonClassName(
                                "font-black text-indigo-600 hover:underline"
                              )}
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
                            className={buttonClassName(
                              "font-black text-slate-900 hover:text-indigo-700 hover:underline"
                            )}
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
                            {isOverdue ? "期限超過" : getStatusLabel(e.status)}
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
                              className={buttonClassName(
                                "inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:bg-slate-50"
                              )}
                              href={`/annual-events/${e.id}`}
                            >
                              詳細
                            </Link>

                            <Link
                              className={buttonClassName(
                                "inline-flex h-8 items-center rounded-lg bg-slate-900 px-3 text-xs font-black text-white hover:bg-slate-800"
                              )}
                              href={`/annual-events/${e.id}/edit`}
                            >
                              編集
                            </Link>

                            {e.status !== "done" ? (
                              <CompleteAnnualEventButton
                                eventId={e.id}
                                returnTo={currentReturnTo}
                              />
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

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
  if (status === "cancelled") return "キャンセル";
  return status || "";
}