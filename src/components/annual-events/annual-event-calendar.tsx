// src/components/annual-events/annual-event-calendar.tsx

import Link from "next/link";

type AnnualEvent = {
  id: string;
  employee_id: string;
  scheduled_date: string;
  title: string;
  event_type: string;
  status: string;
  priority: number | null;
  description?: string | null;
  source_type?: string | null;
  source_id?: string | null;
};

type EmployeeMapValue = {
  id: string;
  employee_code: string;
  name: string;
};

export function AnnualEventCalendar({
  events,
  employeeById,
  today,
  targetYear,
  targetMonth,
  basePath,
}: {
  events: AnnualEvent[];
  employeeById: Map<string, EmployeeMapValue>;
  today: string;
  targetYear: number;
  targetMonth: number;
  basePath: string;
}) {
  const firstDay = new Date(targetYear, targetMonth - 1, 1);
  const lastDay = new Date(targetYear, targetMonth, 0);

  const firstWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const cells: {
    date: string;
    day: number | null;
    events: AnnualEvent[];
  }[] = [];

  for (let i = 0; i < firstWeekday; i++) {
    cells.push({
      date: "",
      day: null,
      events: [],
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = formatDate(new Date(targetYear, targetMonth - 1, day));
    const dayEvents = events.filter((e) => e.scheduled_date === date);

    cells.push({
      date,
      day,
      events: dayEvents,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      date: "",
      day: null,
      events: [],
    });
  }

  const prev = new Date(targetYear, targetMonth - 2, 1);
  const next = new Date(targetYear, targetMonth, 1);

  const prevHref = withCalendarMonth(basePath, prev);
  const nextHref = withCalendarMonth(basePath, next);
  const currentMonthLabel = `${targetYear}年${targetMonth}月`;

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-black tracking-[0.18em] text-indigo-600">
              CALENDAR VIEW
            </div>
            <h2 className="mt-2 text-2xl font-black text-slate-900">
              {currentMonthLabel}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              日付ごとの年間イベントをカレンダー形式で確認できます。
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={prevHref}
              className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              前月
            </Link>

            <Link
              href="/annual-events?view=calendar"
              className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              今月
            </Link>

            <Link
              href={nextHref}
              className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-4 text-sm font-black text-white hover:bg-slate-800"
            >
              翌月
            </Link>
          </div>
        </div>
      </div>

      <div className="overflow-auto rounded-3xl border border-slate-200 bg-white">
        <div className="grid min-w-[980px] grid-cols-7 border-b border-slate-200 bg-slate-50">
          {["日", "月", "火", "水", "木", "金", "土"].map((w, index) => (
            <div
              key={w}
              className={[
                "px-3 py-3 text-center text-sm font-black",
                index === 0
                  ? "text-rose-600"
                  : index === 6
                  ? "text-indigo-600"
                  : "text-slate-500",
              ].join(" ")}
            >
              {w}
            </div>
          ))}
        </div>

        <div className="grid min-w-[980px] grid-cols-7">
          {cells.map((cell, index) => {
            const isToday = cell.date === today;
            const isEmpty = !cell.day;

            return (
              <div
                key={`${cell.date}-${index}`}
                className={[
                  "min-h-[150px] border-b border-r border-slate-100 p-3",
                  isEmpty ? "bg-slate-50" : "bg-white",
                  isToday ? "bg-indigo-50" : "",
                ].join(" ")}
              >
                {cell.day && (
                  <>
                    <div className="flex items-center justify-between">
                      <div
                        className={[
                          "flex h-8 w-8 items-center justify-center rounded-full text-sm font-black",
                          isToday
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-700",
                        ].join(" ")}
                      >
                        {cell.day}
                      </div>

                      {cell.events.length > 0 && (
                        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-black text-white">
                          {cell.events.length}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 space-y-2">
                      {cell.events.length === 0 ? (
                        <div className="text-xs font-semibold text-slate-300">
                          予定なし
                        </div>
                      ) : (
                        cell.events.map((event) => {
                          const employee = employeeById.get(event.employee_id);
                          const isOverdue =
                            event.status === "pending" &&
                            event.scheduled_date < today;

                          return (
                            <Link
                              key={event.id}
                              href={`/annual-events/${event.id}`}
                              className={[
                                "block rounded-xl border p-2 transition hover:-translate-y-0.5 hover:shadow-sm",
                                event.status === "done"
                                  ? "border-emerald-200 bg-emerald-50"
                                  : isOverdue
                                  ? "border-rose-200 bg-rose-50"
                                  : event.status === "canceled"
                                  ? "border-slate-200 bg-slate-50"
                                  : "border-indigo-200 bg-indigo-50",
                              ].join(" ")}
                            >
                              <div
                                className={[
                                  "line-clamp-2 text-xs font-black",
                                  event.status === "done"
                                    ? "text-emerald-700"
                                    : isOverdue
                                    ? "text-rose-700"
                                    : "text-slate-900",
                                ].join(" ")}
                              >
                                {event.title}
                              </div>

                              <div className="mt-1 text-[11px] font-semibold text-slate-500">
                                {employee
                                  ? `${employee.employee_code} / ${employee.name}`
                                  : "社員未取得"}
                              </div>

                              <div className="mt-1 flex flex-wrap gap-1">
                                <span className="rounded-lg bg-white px-1.5 py-0.5 text-[10px] font-black text-slate-600">
                                  {getEventTypeLabel(event.event_type)}
                                </span>

                                <span className="rounded-lg bg-white px-1.5 py-0.5 text-[10px] font-black text-slate-600">
                                  {isOverdue ? "期限超過" : event.status}
                                </span>

                                {event.source_type === "employee_interview" && (
                                  <span className="rounded-lg bg-white px-1.5 py-0.5 text-[10px] font-black text-indigo-600">
                                    面談連動
                                  </span>
                                )}
                              </div>
                            </Link>
                          );
                        })
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function withCalendarMonth(basePath: string, date: Date) {
  const url = new URL(basePath, "http://dummy.local");
  url.searchParams.set("view", "calendar");
  url.searchParams.set("calendarYear", String(date.getFullYear()));
  url.searchParams.set("calendarMonth", String(date.getMonth() + 1));

  return `${url.pathname}?${url.searchParams.toString()}`;
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