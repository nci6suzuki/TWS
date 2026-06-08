// src/components/employees/employee-profile-book.tsx
import Link from "next/link";

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

function TabLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={[
        "px-3 py-2 rounded-xl text-sm font-semibold",
        active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-3 border-b last:border-b-0 py-3">
      <div className="text-sm font-semibold text-slate-600">{label}</div>
      <div className="text-sm text-slate-900">{value}</div>
    </div>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border bg-white p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs font-semibold tracking-[0.12em] text-slate-400">EMPLOYEE</div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">
              {employee.name} <span className="text-slate-400">({employee.employee_code})</span>
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

      {/* Content */}
      {tab === "basic" && (
        <div className="rounded-2xl border bg-white p-6 space-y-4">
          <div className="text-lg font-bold">基本情報</div>
          <div className="rounded-2xl border bg-slate-50 p-4">
            <Row label="社員番号" value={employee.employee_code} />
            <Row label="氏名" value={employee.name} />
            <Row label="メール" value={employee.email} />
            <Row label="入社日" value={employee.hire_date ?? "-"} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card title="要約（任意）" text={profile?.career_summary ?? "-"} />
            <Card title="強み（任意）" text={profile?.strengths ?? "-"} />
            <Card title="課題（任意）" text={profile?.current_issues ?? "-"} />
            <Card title="HRメモ（任意）" text={profile?.notes_hr ?? "-"} />
          </div>
        </div>
      )}

      {tab === "career" && (
        <div className="rounded-2xl border bg-white p-6 space-y-4">
          <div className="text-lg font-bold">キャリア希望</div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card title="1年後の目標" text={goals?.goal_1y ?? "-"} />
            <Card title="3年後の目標" text={goals?.goal_3y ?? "-"} />
            <Card title="希望役割" text={goals?.desired_role ?? "-"} />
            <Card title="希望キャリアパス" text={goals?.desired_career_path ?? "-"} />
            <Card title="リスキリング関心" text={goals?.reskilling_interest ?? "-"} />
            <Card title="異動希望" text={goals?.mobility_preference ?? "-"} />
            <Card title="本人コメント" text={goals?.self_comment ?? "-"} className="lg:col-span-2" />
          </div>
        </div>
      )}

      {tab === "qualifications" && (
        <div className="rounded-2xl border bg-white p-6 space-y-4">
          <div className="text-lg font-bold">資格</div>

          <div className="rounded-2xl border bg-slate-50 p-4 overflow-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="text-slate-500">
                <tr className="border-b">
                  <th className="py-2 text-left">資格名</th>
                  <th className="py-2 text-left">取得日</th>
                  <th className="py-2 text-left">期限</th>
                  <th className="py-2 text-left">状態</th>
                </tr>
              </thead>
              <tbody>
                {qualifications.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500">資格がありません</td>
                  </tr>
                ) : (
                  qualifications.map((q: any) => (
                    <tr key={q.id} className="border-b last:border-b-0">
                      <td className="py-2 font-semibold">
                        {Array.isArray(q.qualification_master)
                          ? q.qualification_master?.[0]?.name ?? "資格"
                          : q.qualification_master?.name ?? "資格"}
                      </td>
                      <td className="py-2">{q.acquired_on ?? "-"}</td>
                      <td className="py-2">{q.expires_on ?? "-"}</td>
                      <td className="py-2">{q.status ?? "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "schedule" && (
        <div className="rounded-2xl border bg-white p-6 space-y-4">
          <div className="text-lg font-bold">年間スケジュール</div>

          <div className="rounded-2xl border bg-slate-50 p-4 overflow-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="text-slate-500">
                <tr className="border-b">
                  <th className="py-2 text-left">予定日</th>
                  <th className="py-2 text-left">タイトル</th>
                  <th className="py-2 text-left">種別</th>
                  <th className="py-2 text-left">状態</th>
                  <th className="py-2 text-left">優先度</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      イベントがありません
                    </td>
                  </tr>
                ) : (
                  events.map((e: any) => (
                    <tr key={e.id} className="border-b last:border-b-0">
                      <td className="py-2">{e.scheduled_date}</td>
                      <td className="py-2 font-semibold">
                        <Link className="text-indigo-600 hover:underline" href={`/annual-events/${e.id}`}>
                          {e.title}
                        </Link>
                      </td>
                      <td className="py-2">{e.event_type}</td>
                      <td className="py-2">{e.status}</td>
                      <td className="py-2">{e.priority}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "interviews" && (
        <div className="rounded-2xl border bg-white p-6 space-y-4">
          <div className="text-lg font-bold">面談履歴</div>

          <div className="grid gap-3">
            {interviews.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-white p-6 text-center text-sm text-slate-500">
                面談がありません
              </div>
            ) : (
              interviews.map((i: any) => (
                <div key={i.id} className="rounded-2xl border bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-semibold text-slate-900">
                      {i.interview_type} / {new Date(i.interview_date).toLocaleString("ja-JP")}
                    </div>
                    <span className="text-xs text-slate-500">id: {i.id}</span>
                  </div>
                  <div className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">
                    {i.notes ?? "-"}
                  </div>
                  {i.next_actions && (
                    <div className="mt-2 text-xs text-slate-600 whitespace-pre-wrap">
                      次アクション：{i.next_actions}
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
    <div className={["rounded-2xl border bg-white p-4", className ?? ""].join(" ")}>
      <div className="text-sm font-bold text-slate-900">{title}</div>
      <div className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{text}</div>
    </div>
  );
}