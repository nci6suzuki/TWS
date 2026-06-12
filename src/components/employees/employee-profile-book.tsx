// src/components/employees/employee-profile-book.tsx
import Link from "next/link";
import { DeleteAnnualEventButton } from "@/components/annual-events/delete-annual-event-button";
import { DeleteQualificationButton } from "@/components/employees/delete-qualification-button";
import { DeleteInterviewButton } from "@/components/employees/delete-interview-button";

type Props = {
  employee: {
    id: string;
    employee_code: string;
    name: string;
    email: string;
    app_role: string;
    status: string;
    hire_date: string | null;
  };
  profile: any | null;
  goals: any | null;
  qualifications: any[];
  events: any[];
  interviews: any[];
  activeTab: string;
};

const tabs = [
  { key: "basic", label: "基本情報" },
  { key: "career", label: "キャリア希望" },
  { key: "qualifications", label: "資格" },
  { key: "schedule", label: "年間スケジュール" },
  { key: "interviews", label: "面談履歴" },
  { key: "timeline", label: "履歴タイムライン" },
];

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getAlertDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

function getQualificationName(q: any) {
  return (
    q.qualification_name ??
    (Array.isArray(q.qualification_master)
      ? q.qualification_master?.[0]?.name
      : q.qualification_master?.name) ??
    "資格"
  );
}

function getInterviewTypeLabel(type: string) {
  if (type === "regular") return "定期面談";
  if (type === "follow") return "フォロー面談";
  if (type === "evaluation") return "評価面談";
  if (type === "career") return "キャリア面談";
  return type || "その他";
}

function getEventTypeLabel(type: string) {
  if (type === "interview") return "面談";
  if (type === "training") return "研修";
  if (type === "evaluation") return "評価";
  if (type === "qualification") return "資格";
  if (type === "contract") return "契約・更新";
  return type || "その他";
}

function TabLink({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={[
        "rounded-xl px-3 py-2 text-sm font-semibold",
        active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-3 border-b py-3 last:border-b-0">
      <div className="text-sm font-semibold text-slate-600">{label}</div>
      <div className="text-sm text-slate-900">{value}</div>
    </div>
  );
}

function InfoCard({
  title,
  text,
  className,
}: {
  title: string;
  text: string;
  className?: string;
}) {
  return (
    <div
      className={["rounded-2xl border bg-white p-4", className ?? ""].join(" ")}
    >
      <div className="text-sm font-bold text-slate-900">{title}</div>
      <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
        {text}
      </div>
    </div>
  );
}

function AlertBadge({ type }: { type: "expired" | "soon" | "ok" }) {
  if (type === "expired") {
    return (
      <span className="inline-flex items-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
        期限切れ
      </span>
    );
  }

  if (type === "soon") {
    return (
      <span className="inline-flex items-center rounded-xl border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
        30日以内
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
      有効
    </span>
  );
}

function EventBadge({
  status,
  isOverdue,
}: {
  status: string;
  isOverdue: boolean;
}) {
  if (status === "done") {
    return (
      <span className="inline-flex items-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        完了
      </span>
    );
  }

  if (status === "canceled") {
    return (
      <span className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
        中止
      </span>
    );
  }

  if (isOverdue) {
    return (
      <span className="inline-flex items-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
        期限超過
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
      未完了
    </span>
  );
}

function TimelineBadge({ type }: { type: string }) {
  if (type === "qualification") {
    return (
      <span className="inline-flex items-center rounded-xl border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
        資格
      </span>
    );
  }

  if (type === "event") {
    return (
      <span className="inline-flex items-center rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
        年間イベント
      </span>
    );
  }

  if (type === "interview") {
    return (
      <span className="inline-flex items-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
        面談
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-600">
      その他
    </span>
  );
}

export function EmployeeProfileBook({
  employee,
  profile,
  goals,
  qualifications,
  events,
  interviews,
  activeTab,
}: Props) {
  const tab = tabs.some((t) => t.key === activeTab) ? activeTab : "basic";

  const today = getToday();
  const alertDate = getAlertDate();

  const expiredQualifications = qualifications.filter(
    (q: any) => q.expires_on && q.expires_on < today
  );

  const expiringSoonQualifications = qualifications.filter(
    (q: any) =>
      q.expires_on && q.expires_on >= today && q.expires_on <= alertDate
  );

  const qualificationAlertCount =
    expiredQualifications.length + expiringSoonQualifications.length;

  const pendingEvents = events.filter((e: any) => e.status === "pending");

  const overdueEvents = events.filter(
    (e: any) => e.status === "pending" && e.scheduled_date < today
  );

  const doneEvents = events.filter((e: any) => e.status === "done");

  const pendingInterviewCount = interviews.filter(
    (i: any) => i.next_interview_date && !i.next_interview_completed_at
  ).length;
  
  const actionItemCount = interviews.filter((i: any) => i.action_items).length;
  
  const hasImportantAlerts =
  expiredQualifications.length > 0 ||
  expiringSoonQualifications.length > 0 ||
  overdueEvents.length > 0 ||
  pendingInterviewCount > 0;

  const timelineItems = [
    ...qualifications.map((q: any) => ({
      id: `qualification-${q.id}`,
      type: "qualification",
      date: q.acquired_on ?? q.expires_on ?? "",
      title: getQualificationName(q),
      description: [
        q.acquired_on ? `取得日：${q.acquired_on}` : "",
        q.expires_on ? `有効期限：${q.expires_on}` : "",
        q.status ? `状態：${q.status}` : "",
        q.memo ? `メモ：${q.memo}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      href: `/employees/code/${employee.employee_code}?tab=qualifications`,
    })),

    ...events.map((e: any) => ({
      id: `event-${e.id}`,
      type: "event",
      date: e.scheduled_date ?? "",
      title: e.title ?? "年間イベント",
      description: [
        e.event_type ? `種別：${getEventTypeLabel(e.event_type)}` : "",
        e.status ? `状態：${e.status}` : "",
        e.priority ? `優先度：${e.priority}` : "",
        e.description ? e.description : "",
      ]
        .filter(Boolean)
        .join("\n"),
      href: `/annual-events/${e.id}`,
    })),

    ...interviews.map((i: any) => ({
      id: `interview-${i.id}`,
      type: "interview",
      date: i.interview_date ?? "",
      title: getInterviewTypeLabel(i.interview_type),
      description: [
        i.interviewer_name ? `面談者：${i.interviewer_name}` : "",
        i.summary ? `内容：${i.summary}` : "",
        i.action_items ? `次回アクション：${i.action_items}` : "",
        i.next_interview_date ? `次回面談予定：${i.next_interview_date}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      href: `/employees/code/${employee.employee_code}/interviews/${i.id}/edit`,
    })),
  ]
    .filter((item) => item.date)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs font-semibold tracking-[0.12em] text-slate-400">
              EMPLOYEE
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">
              {employee.name}{" "}
              <span className="text-slate-400">({employee.employee_code})</span>
            </div>
            <div className="mt-2 text-sm text-slate-600">{employee.email}</div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-xl border bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
              role: {employee.app_role}
            </span>

            <span className="rounded-xl border bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
              status: {employee.status}
            </span>

            <Link
              href={`/employees/code/${employee.employee_code}/edit`}
              className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
            >
              編集
            </Link>

            <Link
              href={`/annual-events/new?employeeCode=${employee.employee_code}`}
              className="inline-flex h-10 items-center rounded-xl border bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              年間イベント作成
            </Link>

            <Link
              href={`/employees/code/${employee.employee_code}/qualifications`}
              className="inline-flex h-10 items-center rounded-xl border bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              資格管理
            </Link>

            <Link
              href={`/employees/code/${employee.employee_code}/interviews`}
              className="inline-flex h-10 items-center rounded-xl border bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              面談管理
            </Link>

            <Link
              href="/employees"
              className="inline-flex h-10 items-center rounded-xl border bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              一覧へ戻る
            </Link>
          </div>
        </div>

        {qualificationAlertCount > 0 && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-black text-amber-800">
                  資格更新アラートがあります
                </div>
                <div className="mt-1 text-sm font-semibold text-amber-700">
                  期限切れ {expiredQualifications.length}件 / 30日以内{" "}
                  {expiringSoonQualifications.length}件
                </div>
              </div>

              <Link
                href={`/employees/code/${employee.employee_code}?tab=qualifications`}
                className="inline-flex h-9 items-center justify-center rounded-xl bg-amber-600 px-4 text-sm font-black text-white hover:bg-amber-700"
              >
                資格タブを見る
              </Link>
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <TabLink
              key={t.key}
              href={`/employees/code/${employee.employee_code}?tab=${t.key}`}
              active={tab === t.key}
              label={t.label}
            />
          ))}
        </div>
                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-5">
          <Link
            href={`/employees/code/${employee.employee_code}?tab=qualifications`}
            className={[
              "rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-sm",
              expiredQualifications.length > 0
                ? "border-rose-200 bg-rose-50"
                : "border-slate-200 bg-slate-50",
            ].join(" ")}
          >
            <div
              className={[
                "text-xs font-black tracking-[0.12em]",
                expiredQualifications.length > 0
                  ? "text-rose-700"
                  : "text-slate-500",
              ].join(" ")}
            >
              資格期限切れ
            </div>
            <div
              className={[
                "mt-2 text-2xl font-black",
                expiredQualifications.length > 0
                  ? "text-rose-700"
                  : "text-slate-900",
              ].join(" ")}
            >
              {expiredQualifications.length}
            </div>
          </Link>

          <Link
            href={`/employees/code/${employee.employee_code}?tab=qualifications`}
            className={[
              "rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-sm",
              expiringSoonQualifications.length > 0
                ? "border-amber-200 bg-amber-50"
                : "border-slate-200 bg-slate-50",
            ].join(" ")}
          >
            <div
              className={[
                "text-xs font-black tracking-[0.12em]",
                expiringSoonQualifications.length > 0
                  ? "text-amber-700"
                  : "text-slate-500",
              ].join(" ")}
            >
              資格30日以内
            </div>
            <div
              className={[
                "mt-2 text-2xl font-black",
                expiringSoonQualifications.length > 0
                  ? "text-amber-700"
                  : "text-slate-900",
              ].join(" ")}
            >
              {expiringSoonQualifications.length}
            </div>
          </Link>

          <Link
            href={`/employees/code/${employee.employee_code}?tab=schedule`}
            className={[
              "rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-sm",
              overdueEvents.length > 0
                ? "border-rose-200 bg-rose-50"
                : "border-slate-200 bg-slate-50",
            ].join(" ")}
          >
            <div
              className={[
                "text-xs font-black tracking-[0.12em]",
                overdueEvents.length > 0 ? "text-rose-700" : "text-slate-500",
              ].join(" ")}
            >
              イベント期限超過
            </div>
            <div
              className={[
                "mt-2 text-2xl font-black",
                overdueEvents.length > 0 ? "text-rose-700" : "text-slate-900",
              ].join(" ")}
            >
              {overdueEvents.length}
            </div>
          </Link>

          <Link
            href={`/employees/code/${employee.employee_code}?tab=schedule`}
            className={[
              "rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-sm",
              pendingEvents.length > 0
                ? "border-indigo-200 bg-indigo-50"
                : "border-slate-200 bg-slate-50",
            ].join(" ")}
          >
            <div
              className={[
                "text-xs font-black tracking-[0.12em]",
                pendingEvents.length > 0
                  ? "text-indigo-700"
                  : "text-slate-500",
              ].join(" ")}
            >
              未完了イベント
            </div>
            <div
              className={[
                "mt-2 text-2xl font-black",
                pendingEvents.length > 0
                  ? "text-indigo-700"
                  : "text-slate-900",
              ].join(" ")}
            >
              {pendingEvents.length}
            </div>
          </Link>

          <Link
            href={`/employees/code/${employee.employee_code}?tab=interviews`}
            className={[
              "rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-sm",
              pendingInterviewCount > 0
                ? "border-emerald-200 bg-emerald-50"
                : "border-slate-200 bg-slate-50",
            ].join(" ")}
          >
            <div
              className={[
                "text-xs font-black tracking-[0.12em]",
                pendingInterviewCount > 0
                  ? "text-emerald-700"
                  : "text-slate-500",
              ].join(" ")}
            >
              次回面談予定
            </div>
            <div
              className={[
                "mt-2 text-2xl font-black",
                pendingInterviewCount > 0
                  ? "text-emerald-700"
                  : "text-slate-900",
              ].join(" ")}
            >
              {pendingInterviewCount}
            </div>
          </Link>
        </div>

        {hasImportantAlerts && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-black text-amber-800">
                  要対応の項目があります
                </div>
                <div className="mt-1 text-sm font-semibold text-amber-700">
                  資格・年間イベント・面談予定を確認してください。
                </div>
              </div>

              <Link
                href={`/employees/code/${employee.employee_code}?tab=timeline`}
                className="inline-flex h-9 items-center justify-center rounded-xl bg-amber-600 px-4 text-sm font-black text-white hover:bg-amber-700"
              >
                タイムラインで確認
              </Link>
            </div>
          </div>
        )}
      </div>

      {tab === "basic" && (
        <div className="space-y-4 rounded-2xl border bg-white p-6">
          <div className="text-lg font-bold">基本情報</div>

          <div className="rounded-2xl border bg-slate-50 p-4">
            <Row label="社員番号" value={employee.employee_code} />
            <Row label="氏名" value={employee.name} />
            <Row label="メール" value={employee.email} />
            <Row label="入社日" value={employee.hire_date ?? "-"} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <InfoCard title="要約（任意）" text={profile?.career_summary ?? "-"} />
            <InfoCard title="強み（任意）" text={profile?.strengths ?? "-"} />
            <InfoCard title="課題（任意）" text={profile?.current_issues ?? "-"} />
            <InfoCard title="HRメモ（任意）" text={profile?.notes_hr ?? "-"} />
          </div>
        </div>
      )}

      {tab === "career" && (
        <div className="space-y-4 rounded-2xl border bg-white p-6">
          <div className="text-lg font-bold">キャリア希望</div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <InfoCard title="1年後の目標" text={goals?.goal_1y ?? "-"} />
            <InfoCard title="3年後の目標" text={goals?.goal_3y ?? "-"} />
            <InfoCard title="希望役割" text={goals?.desired_role ?? "-"} />
            <InfoCard
              title="希望キャリアパス"
              text={goals?.desired_career_path ?? "-"}
            />
            <InfoCard
              title="リスキリング関心"
              text={goals?.reskilling_interest ?? "-"}
            />
            <InfoCard
              title="異動希望"
              text={goals?.mobility_preference ?? "-"}
            />
            <InfoCard
              title="本人コメント"
              text={goals?.self_comment ?? "-"}
              className="lg:col-span-2"
            />
          </div>
        </div>
      )}

      {tab === "qualifications" && (
        <div className="space-y-4 rounded-2xl border bg-white p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-lg font-bold">資格</div>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                保有資格、取得日、有効期限、更新状況を確認できます。
              </p>
            </div>

            <Link
              href={`/employees/code/${employee.employee_code}/qualifications`}
              className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
            >
              資格管理
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-2xl border bg-slate-50 p-4">
              <div className="text-xs font-black tracking-[0.12em] text-slate-500">
                登録資格数
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900">
                {qualifications.length}
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="text-xs font-black tracking-[0.12em] text-amber-700">
                30日以内
              </div>
              <div className="mt-2 text-2xl font-black text-amber-700">
                {expiringSoonQualifications.length}
              </div>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <div className="text-xs font-black tracking-[0.12em] text-rose-700">
                期限切れ
              </div>
              <div className="mt-2 text-2xl font-black text-rose-700">
                {expiredQualifications.length}
              </div>
            </div>
          </div>

          <div className="overflow-auto rounded-2xl border bg-slate-50 p-4">
            <table className="min-w-[1000px] w-full text-sm">
              <thead className="text-slate-500">
                <tr className="border-b">
                  <th className="py-2 text-left">資格名</th>
                  <th className="py-2 text-left">取得日</th>
                  <th className="py-2 text-left">期限</th>
                  <th className="py-2 text-left">状態</th>
                  <th className="py-2 text-left">メモ</th>
                  <th className="py-2 text-left">操作</th>
                </tr>
              </thead>

              <tbody>
                {qualifications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">
                      資格がありません
                    </td>
                  </tr>
                ) : (
                  qualifications.map((q: any) => {
                    const isExpired = q.expires_on && q.expires_on < today;
                    const isSoon =
                      q.expires_on &&
                      q.expires_on >= today &&
                      q.expires_on <= alertDate;

                    return (
                      <tr key={q.id} className="border-b last:border-b-0">
                        <td className="py-3 font-semibold text-slate-900">
                          {getQualificationName(q)}
                        </td>

                        <td className="py-3 text-slate-600">
                          {q.acquired_on ?? "-"}
                        </td>

                        <td className="py-3">
                          {q.expires_on ? (
                            <span
                              className={[
                                "font-semibold",
                                isExpired
                                  ? "text-rose-600"
                                  : isSoon
                                  ? "text-amber-600"
                                  : "text-slate-600",
                              ].join(" ")}
                            >
                              {q.expires_on}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="py-3">
                          {isExpired ? (
                            <AlertBadge type="expired" />
                          ) : isSoon ? (
                            <AlertBadge type="soon" />
                          ) : (
                            <AlertBadge type="ok" />
                          )}
                        </td>

                        <td className="py-3 text-slate-600">{q.memo ?? "-"}</td>

                        <td className="py-3">
                          <DeleteQualificationButton
                            employeeCode={employee.employee_code}
                            qualificationId={q.id}
                            returnTo={`/employees/code/${employee.employee_code}?tab=qualifications`}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "schedule" && (
        <div className="space-y-4 rounded-2xl border bg-white p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-lg font-bold">年間イベント</div>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                この社員に紐づく面談、評価、研修、資格更新などの予定を確認できます。
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/annual-events/new?employeeCode=${employee.employee_code}`}
                className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
              >
                年間イベント作成
              </Link>

              <Link
                href={`/annual-events?employeeCode=${employee.employee_code}`}
                className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                一覧で見る
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="rounded-2xl border bg-slate-50 p-4">
              <div className="text-xs font-black tracking-[0.12em] text-slate-500">
                登録数
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900">
                {events.length}
              </div>
            </div>

            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
              <div className="text-xs font-black tracking-[0.12em] text-indigo-700">
                未完了
              </div>
              <div className="mt-2 text-2xl font-black text-indigo-700">
                {pendingEvents.length}
              </div>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <div className="text-xs font-black tracking-[0.12em] text-rose-700">
                期限超過
              </div>
              <div className="mt-2 text-2xl font-black text-rose-700">
                {overdueEvents.length}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="text-xs font-black tracking-[0.12em] text-emerald-700">
                完了
              </div>
              <div className="mt-2 text-2xl font-black text-emerald-700">
                {doneEvents.length}
              </div>
            </div>
          </div>

          <div className="overflow-auto rounded-2xl border bg-slate-50">
            <table className="min-w-[1000px] w-full text-sm">
              <thead className="text-slate-500">
                <tr className="border-b bg-white">
                  <th className="px-4 py-3 text-left font-black">予定日</th>
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
                      colSpan={7}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      登録されている年間イベントはありません
                    </td>
                  </tr>
                ) : (
                  events.map((e: any) => {
                    const isOverdue =
                      e.status === "pending" && e.scheduled_date < today;

                    return (
                      <tr
                        key={e.id}
                        className="border-b bg-white last:border-b-0 hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 font-semibold text-slate-700">
                          {e.scheduled_date}
                        </td>

                        <td className="px-4 py-3">
                          <Link
                            href={`/annual-events/${e.id}`}
                            className="font-black text-slate-900 hover:underline"
                          >
                            {e.title}
                          </Link>

                          {e.description && (
                            <div className="mt-1 line-clamp-2 text-xs font-semibold text-slate-500">
                              {e.description}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          {getEventTypeLabel(e.event_type)}
                        </td>

                        <td className="px-4 py-3">
                          <EventBadge
                            status={e.status}
                            isOverdue={isOverdue}
                          />
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          {e.priority}
                        </td>

                        <td className="px-4 py-3">
                          {e.source_type === "employee_interview" ? (
                            <span className="inline-flex items-center rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                              面談連動
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/annual-events/${e.id}`}
                              className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:bg-slate-50"
                            >
                              詳細
                            </Link>

                            <Link
                              href={`/annual-events/${e.id}/edit`}
                              className="inline-flex h-8 items-center rounded-lg bg-slate-900 px-3 text-xs font-black text-white hover:bg-slate-800"
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
                                  value={`/employees/code/${employee.employee_code}?tab=schedule`}
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
                              returnTo={`/employees/code/${employee.employee_code}?tab=schedule`}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "interviews" && (
        <div className="space-y-4 rounded-2xl border bg-white p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-lg font-bold">面談履歴</div>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                面談履歴、次回アクション、次回面談予定を確認できます。
              </p>
            </div>

            <Link
              href={`/employees/code/${employee.employee_code}/interviews`}
              className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
            >
              面談管理
            </Link>
          </div>

          <div className="space-y-3">
            {interviews.length === 0 ? (
              <div className="rounded-2xl border bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
                面談履歴がありません
              </div>
            ) : (
              interviews.map((i: any) => (
                <div key={i.id} className="rounded-2xl border bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-xl border bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                        {i.interview_date}
                      </span>

                      <span className="rounded-xl border bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                        {getInterviewTypeLabel(i.interview_type)}
                      </span>

                      {i.next_interview_date &&
                        !i.next_interview_completed_at && (
                          <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            次回: {i.next_interview_date}
                          </span>
                        )}

                      {i.next_interview_completed_at && (
                        <span className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                          次回面談完了:{" "}
                          {String(i.next_interview_completed_at).slice(0, 10)}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/employees/code/${employee.employee_code}/interviews/${i.id}/edit`}
                        className="inline-flex h-8 items-center rounded-lg bg-slate-900 px-3 text-xs font-black text-white hover:bg-slate-800"
                      >
                        編集
                      </Link>

                      <DeleteInterviewButton
                        employeeCode={employee.employee_code}
                        interviewId={i.id}
                        returnTo={`/employees/code/${employee.employee_code}?tab=interviews`}
                      />
                    </div>
                  </div>

                  <div className="mt-3 text-sm font-black text-slate-900">
                    面談者：{i.interviewer_name || "-"}
                  </div>

                  <div className="mt-3 whitespace-pre-wrap text-sm font-semibold text-slate-700">
                    {i.summary || "-"}
                  </div>

                  {i.action_items && (
                    <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50 p-3">
                      <div className="text-xs font-black text-indigo-700">
                        次回アクション
                      </div>
                      <div className="mt-1 whitespace-pre-wrap text-sm font-semibold text-indigo-700">
                        {i.action_items}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === "timeline" && (
        <div className="space-y-4 rounded-2xl border bg-white p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-lg font-bold">履歴タイムライン</div>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                資格、年間イベント、面談履歴を日付順でまとめて確認できます。
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-xl border bg-slate-50 px-3 py-2 text-xs font-black text-slate-700">
                全履歴: {timelineItems.length}
              </span>
              <span className="rounded-xl border bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">
                資格: {qualifications.length}
              </span>
              <span className="rounded-xl border bg-indigo-50 px-3 py-2 text-xs font-black text-indigo-700">
                年間イベント: {events.length}
              </span>
              <span className="rounded-xl border bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                面談: {interviews.length}
              </span>
            </div>
          </div>

          {timelineItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-slate-50 p-8 text-center">
              <div className="text-sm font-bold text-slate-500">
                表示できる履歴がありません
              </div>
            </div>
          ) : (
            <div className="relative space-y-4">
              <div className="absolute bottom-0 left-[18px] top-0 w-px bg-slate-200" />

              {timelineItems.map((item) => (
                <div key={item.id} className="relative flex gap-4">
                  <div className="relative z-10 mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-black text-slate-500">
                    ●
                  </div>

                  <div className="flex-1 rounded-2xl border bg-slate-50 p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <TimelineBadge type={item.type} />
                          <span className="text-sm font-black text-slate-500">
                            {item.date}
                          </span>
                        </div>

                        <div className="mt-2 text-base font-black text-slate-900">
                          {item.title}
                        </div>
                      </div>

                      <Link
                        href={item.href}
                        className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:bg-slate-50"
                      >
                        関連ページへ
                      </Link>
                    </div>

                    {item.description && (
                      <div className="mt-3 whitespace-pre-wrap rounded-xl border bg-white p-3 text-sm font-semibold text-slate-700">
                        {item.description}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}