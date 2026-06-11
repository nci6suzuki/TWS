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

function AlertBadge({
  type,
}: {
  type: "expired" | "soon" | "ok";
}) {
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

  const today = getToday();
const alertDate = getAlertDate();

const expiredQualifications = qualifications.filter(
  (q: any) => q.expires_on && q.expires_on < today
);

const expiringSoonQualifications = qualifications.filter(
  (q: any) =>
    q.expires_on &&
    q.expires_on >= today &&
    q.expires_on <= alertDate
);

const qualificationAlertCount =
  expiredQualifications.length + expiringSoonQualifications.length;

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
  href={`/employees/code/${employee.employee_code}/edit`}
  className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
>
  編集
</Link>

<Link
  href={`/annual-events/new?employeeCode=${employee.employee_code}`}
  className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
>
  年間イベント作成
</Link>

<Link
  href={`/employees/code/${employee.employee_code}/qualifications`}
  className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
>
  資格管理
</Link>

<Link
  href={`/employees/code/${employee.employee_code}/interviews`}
  className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
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

    <div className="rounded-2xl border bg-slate-50 p-4 overflow-auto">
      <table className="min-w-[900px] w-full text-sm">
        <thead className="text-slate-500">
          <tr className="border-b">
            <th className="py-2 text-left">資格名</th>
            <th className="py-2 text-left">取得日</th>
            <th className="py-2 text-left">期限</th>
            <th className="py-2 text-left">状態</th>
            <th className="py-2 text-left">メモ</th>
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

                  <td className="py-3 text-slate-600">
                    {q.memo ?? "-"}
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

    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <div className="rounded-2xl border bg-slate-50 p-4">
        <div className="text-xs font-black tracking-[0.12em] text-slate-500">
          面談件数
        </div>
        <div className="mt-2 text-2xl font-black text-slate-900">
          {interviews.length}
        </div>
      </div>

      <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
        <div className="text-xs font-black tracking-[0.12em] text-indigo-700">
          アクションあり
        </div>
        <div className="mt-2 text-2xl font-black text-indigo-700">
          {interviews.filter((i: any) => i.action_items).length}
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="text-xs font-black tracking-[0.12em] text-emerald-700">
          次回面談予定あり
        </div>
        <div className="mt-2 text-2xl font-black text-emerald-700">
          {interviews.filter((i: any) => i.next_interview_date).length}
        </div>
      </div>
    </div>

    <div className="space-y-3">
      {interviews.length === 0 ? (
        <div className="rounded-2xl border bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
          面談履歴がありません
        </div>
      ) : (
        interviews.map((i: any) => (
          <div key={i.id} className="rounded-2xl border bg-slate-50 p-4">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-xl border bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                {i.interview_date}
              </span>
              <span className="rounded-xl border bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                {getInterviewTypeLabel(i.interview_type)}
              </span>
{i.next_interview_date && !i.next_interview_completed_at && (
  <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
    次回: {i.next_interview_date}
  </span>
)}

{i.next_interview_completed_at && (
  <span className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
    次回面談完了: {String(i.next_interview_completed_at).slice(0, 10)}
  </span>
)}
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

function getInterviewTypeLabel(type: string) {
  if (type === "regular") return "定期面談";
  if (type === "follow") return "フォロー面談";
  if (type === "evaluation") return "評価面談";
  if (type === "career") return "キャリア面談";
  return "その他";
}