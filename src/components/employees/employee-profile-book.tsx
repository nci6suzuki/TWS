import Link from "next/link";
import type { EmployeeSummary, Me } from "@/types/api";
import { EmployeeBasicPanel } from "@/components/employees/panels/employee-basic-panel";
import { EmployeeOverviewPanel } from "@/components/employees/employee-overview-panel";
import { EmployeeCareerPanel } from "@/components/employees/panels/employee-career-panel";
import { EmployeeAnnualEventsPanel } from "@/components/employees/panels/employee-annual-events-panel";
import { EmployeeInterviewsPanel } from "@/components/employees/panels/employee-interviews-panel";
import { EmployeeQualificationsPanel } from "@/components/employees/panels/employee-qualifications-panel";

const tabs = [
  { key: "basic", label: "プロフィール", description: "基本情報・所属" },
  { key: "career", label: "キャリア", description: "志向・将来像" },
  { key: "qualifications", label: "資格", description: "保有資格・期限" },
  { key: "schedule", label: "シート", description: "年間イベント" },
  { key: "interviews", label: "レビュー", description: "面談履歴" },
] as const;

export async function EmployeeProfileBook({
  me,
  employeeId,
  tab,
  summary,
}: {
  me: Me;
  employeeId: string;
  tab: string;
  summary: EmployeeSummary;
}) {
  const active = tabs.some((item) => item.key === tab) ? tab : "basic";

  return (
    <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
        <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-semibold text-slate-500">キーワード検索</div>
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-400">プロフィールブック内検索は次フェーズで対応</div>
        </div>

        <div>
          <div className="px-2 text-lg font-bold text-slate-900">プロフィールブック</div>
          <nav className="mt-3 space-y-1">
            {tabs.map((item) => {
              const isActive = active === item.key;
              return (
                <Link
                  key={item.key}
                  href={`/employees/${employeeId}?tab=${item.key}`}
                  className={[
                    "block rounded-[18px] border px-4 py-3 no-underline transition",
                    isActive
                      ? "border-indigo-300 bg-indigo-50 shadow-sm"
                      : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <div className="font-semibold text-slate-900">{item.label}</div>
                  <div className="mt-1 text-xs text-slate-500">{item.description}</div>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <section className="space-y-4">
        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_22px_50px_rgba(15,23,42,0.08)]">
          <div className="relative overflow-hidden border-b border-slate-100 bg-[linear-gradient(135deg,#fff8e6_0%,#fffdf5_48%,#f8fafc_100%)] px-6 py-6 sm:px-8">
            <div className="absolute right-10 top-5 hidden h-24 w-24 rounded-full border border-amber-100 bg-amber-50/60 sm:block" />
            <div className="absolute right-24 top-10 hidden h-3 w-3 rounded-full bg-amber-200 sm:block" />
            <div className="absolute right-16 top-16 hidden h-3 w-3 rounded-full bg-amber-100 sm:block" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-5">
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white text-4xl font-bold text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.12)] ring-4 ring-white">
                  {summary.name.slice(0, 1)}
                </div>
                <div>
                  <div className="text-sm font-semibold tracking-[0.14em] text-indigo-600">PROFILE BOOK</div>
                  <h1 className="mt-2 text-3xl font-bold text-slate-900">{summary.name}</h1>
                  <div className="mt-2 text-sm text-slate-500">社員番号: {summary.employeeCode}</div>
                  <div className="mt-3 text-base text-slate-700">{summary.departmentName || "部署未設定"} {summary.positionName ? `> ${summary.positionName}` : ""}</div>
                </div>
              </div>
              <div className="grid gap-2 sm:min-w-[220px]">
                <SummaryMetric label="拠点" value={summary.branchName || "-"} />
                <SummaryMetric label="等級" value={summary.gradeName || "-"} />
                <SummaryMetric label="入社日" value={summary.hireDate || "-"} />
              </div>
            </div>
          </div>
          <div className="px-6 py-4 text-sm text-slate-500 sm:px-8">見やすい左ナビ + 右コンテンツ構成に変更し、プロフィールブックらしい閲覧体験にしています。</div>
        </div>

        <EmployeeOverviewPanel me={me} employeeId={employeeId} />

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] sm:p-6">
          {active === "basic" && <EmployeeBasicPanel me={me} employeeId={employeeId} />}
          {active === "career" && <EmployeeCareerPanel me={me} employeeId={employeeId} />}
          {active === "qualifications" && <EmployeeQualificationsPanel employeeId={employeeId} />}
          {active === "schedule" && <EmployeeAnnualEventsPanel me={me} employeeId={employeeId} />}
          {active === "interviews" && <EmployeeInterviewsPanel me={me} employeeId={employeeId} />}
        </div>
      </section>
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
      <div className="text-xs font-semibold tracking-[0.12em] text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-800">{value}</div>
    </div>
  );
}