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
];

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border bg-white p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
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

        {/* Tabs */}
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
      </div>

      {/* 基本情報 */}
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
            <Card title="要約（任意）" text={profile?.career_summary ?? "-"} />
            <Card title="強み（任意）" text={profile?.strengths ?? "-"} />
            <Card title="課題（任意）" text={profile?.current_issues ?? "-"} />
            <Card title="HRメモ（任意）" text={profile?.notes_hr ?? "-"} />
          </div>
        </div>
      )}

      {/* キャリア希望 */}
      {tab === "career" && (
        <div className="space-y-4 rounded-2xl border bg-white p-6">
          <div className="text-lg font-bold">キャリア希望</div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card title="1年後の目標" text={goals?.goal_1y ?? "-"} />
            <Card title="3年後の目標" text={goals?.goal_3y ?? "-"} />
            <Card title="希望役割" text={goals?.desired_role ?? "-"} />
            <Card
              title="希望キャリアパス"
              text={goals?.desired_career_path ?? "-"}
            />
            <Card
              title="リスキリング関心"
              text={goals?.reskilling_interest ?? "-"}
            />
            <Card title="異動希望" text={goals?.mobility_preference ?? "-"} />
            <Card
              title="本人コメント"
              text={goals?.self_comment ?? "-"}
              className="lg:col-span-2"
            />
          </div>
        </div>
      )}

      {/* 資格 */}
      {tab === "qualifications" && (
        <div className="space-y-4 rounded-2xl border bg-white p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-lg font-bold">資格</div>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                保有資格の確認と削除ができます。
              </p>
            </div>

            <Link
              href={`/employees/code/${employee.employee_code}/qualifications`}
              className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
            >
              資格管理
            </Link>
          </div>

          <div className="overflow-auto rounded-2xl border bg-slate-50 p-4">
            <table className="min-w-[1000px] w-full text-sm">
              <thead className="text-slate-500">
                <tr className="border-b">
                  <th className="py-2 text-left">資格名</th>
                  <th className="py-2 text-left">取得日</th>
                  <th className="py-2 text-left">期限</th>
                  <th className="py-2 text-left">状態</th>
                  <th className="py-2 text-left">操作</th>
                </tr>
              </thead>

              <tbody>
                {qualifications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      資格がありません
                    </td>
                  </tr>
                ) : (
                  qualifications.map((q: any) => (
                    <tr key={q.id} className="border-b last:border-b-0">
                      <td className="py-3 font-semibold">
                        {getQualificationName(q)}
                      </td>
                      <td className="py-3">{q.acquired_on ?? "-"}</td>
                      <td className="py-3">{q.expires_on ?? "-"}</td>
                      <td className="py-3">{q.status ?? "-"}</td>
                      <td className="py-3">
                        <DeleteQualificationButton
                          employeeCode={employee.employee_code}
                          qualificationId={q.id}
                          returnTo={`/employees/code/${employee.employee_code}?tab=qualifications`}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 年間スケジュール */}
      {tab === "schedule" && (
        <div className="space-y-4 rounded-2xl border bg-white p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-lg font-bold">年間スケジュール</div>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                年間イベントの確認、編集、削除ができます。
              </p>
            </div>

            <Link
              href={`/annual-events/new?employeeCode=${employee.employee_code}`}
              className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
            >
              年間イベント作成
            </Link>
          </div>

          <div className="overflow-auto rounded-2xl border bg-slate-50 p-4">
            <table className="min-w-[1100px] w-full text-sm">
              <thead className="text-slate-500">
                <tr className="border-b">
                  <th className="py-2 text-left">予定日</th>
                  <th className="py-2 text-left">タイトル</th>
                  <th className="py-2 text-left">種別</th>
                  <th className="py-2 text-left">状態</th>
                  <th className="py-2 text-left">優先度</th>
                  <th className="py-2 text-left">操作</th>
                </tr>
              </thead>

              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">
                      イベントがありません
                    </td>
                  </tr>
                ) : (
                  events.map((e: any) => (
                    <tr key={e.id} className="border-b last:border-b-0">
                      <td className="py-3">{e.scheduled_date}</td>
                      <td className="py-3 font-semibold">
                        <Link
                          className="text-indigo-600 hover:underline"
                          href={`/annual-events/${e.id}`}
                        >
                          {e.title}
                        </Link>
                      </td>
                      <td className="py-3">{getEventTypeLabel(e.event_type)}</td>
                      <td className="py-3">{e.status}</td>
                      <td className="py-3">{e.priority}</td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/annual-events/${e.id}/edit`}
                            className="inline-flex h-8 items-center rounded-lg bg-slate-900 px-3 text-xs font-black text-white hover:bg-slate-800"
                          >
                            編集
                          </Link>

                          <DeleteAnnualEventButton
                            eventId={e.id}
                            returnTo={`/employees/code/${employee.employee_code}?tab=schedule`}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 面談履歴 */}
      {tab === "interviews" && (
        <div className="space-y-4 rounded-2xl border bg-white p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-lg font-bold">面談履歴</div>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                面談履歴の確認と削除ができます。関連する年間イベントも削除されます。
              </p>
            </div>

            <Link
              href={`/employees/code/${employee.employee_code}/interviews`}
              className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
            >
              面談管理
            </Link>
          </div>

          <div className="grid gap-3">
            {interviews.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-white p-6 text-center text-sm text-slate-500">
                面談がありません
              </div>
            ) : (
              interviews.map((i: any) => (
                <div key={i.id} className="rounded-2xl border bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {getInterviewTypeLabel(i.interview_type)} /{" "}
                        {i.interview_date
                          ? new Date(i.interview_date).toLocaleDateString("ja-JP")
                          : "-"}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        id: {i.id}
                      </div>
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

                  <div className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
                    {i.summary ?? i.notes ?? "-"}
                  </div>

                  {(i.action_items || i.next_actions) && (
                    <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50 p-3">
                      <div className="text-xs font-black text-indigo-700">
                        次アクション
                      </div>
                      <div className="mt-1 whitespace-pre-wrap text-sm font-semibold text-indigo-700">
                        {i.action_items ?? i.next_actions}
                      </div>
                    </div>
                  )}

                  {i.next_interview_date && (
                    <div className="mt-3 text-xs font-semibold text-emerald-700">
                      次回面談予定：{i.next_interview_date}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Card({
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