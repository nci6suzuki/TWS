"use client";

import Link from "next/link";
import { ReactNode, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { EmployeeListItem, Me, Pagination } from "@/types/api";
import { InviteEmployeeButton } from "@/components/employees/invite-employee-button";

type Props = {
  me: Me;
  employees: EmployeeListItem[];
  pagination: Pagination;
};

const statusLabel: Record<EmployeeListItem["status"], string> = {
  active: "在籍",
  leave: "休職",
  inactive: "退職/無効",
};

const statusTone: Record<EmployeeListItem["status"], string> = {
  active: "#16a34a",
  leave: "#d97706",
  inactive: "#64748b",
};

export function EmployeeDirectory({ me, employees, pagination }: Props) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const departmentCounts = useMemo(() => {
    return employees.reduce<Record<string, number>>((acc, employee) => {
      const key = employee.departmentName || "未設定";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  }, [employees]);

  const branchCounts = useMemo(() => {
    return employees.reduce<Record<string, number>>((acc, employee) => {
      const key = employee.branchName || "未設定";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  }, [employees]);

  const rangeText = useMemo(() => {
    if (pagination.total === 0) return "0件";
    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(pagination.page * pagination.limit, pagination.total);
    return `${start}-${end} / ${pagination.total}件`;
  }, [pagination]);

  function hrefForPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    return `${pathname}?${params.toString()}`;
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-5">
          <div>
            <div className="text-sm text-slate-500">メンバー</div>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">{pagination.total}人</h2>
            <div className="mt-1 text-xs text-slate-500">表示範囲: {rangeText}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-slate-200 bg-slate-50 p-1">
              <button type="button" onClick={() => setViewMode("grid")} className={buttonClass(viewMode === "grid")}>
                グリッド
              </button>
              <button type="button" onClick={() => setViewMode("list")} className={buttonClass(viewMode === "list")}>
                リスト
              </button>
            </div>
          </div>
        </div>

        {employees.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500">
            {me.role === "manager" ? "表示可能な社員データがありません。" : "条件に一致する社員がいません。"}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {employees.map((employee) => (
              <Link
                key={employee.id}
                href={`/employees/${employee.id}?tab=basic`}
                className="group rounded-[24px] border border-slate-200 bg-white p-4 text-left no-underline transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-[0_20px_40px_rgba(79,70,229,0.12)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-gradient-to-br from-amber-100 via-white to-indigo-100 text-xl font-bold text-slate-700 ring-1 ring-slate-200">
                      {employee.name.slice(0, 1)}
                    </div>
                    <div>
                      <div className="text-lg font-bold text-slate-900 group-hover:text-indigo-700">{employee.name}</div>
                      <div className="text-xs text-slate-500">{employee.employeeCode}</div>
                    </div>
                  </div>
                  <StatusDot status={employee.status} />
                </div>

                <dl className="mt-4 space-y-2 text-sm text-slate-600">
                  <InfoRow label="所属" value={employee.departmentName || employee.branchName || "-"} />
                  <InfoRow label="役職" value={employee.positionName || "-"} />
                  <InfoRow label="等級" value={employee.gradeName || "-"} />
                  <InfoRow label="メール" value={employee.email || "-"} />
                </dl>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span>{statusLabel[employee.status]}</span>
                  <span className="font-semibold text-indigo-700">プロフィールを見る →</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-slate-500">
                  <th className="px-6 py-4 font-medium">氏名</th>
                  <th className="px-4 py-4 font-medium">社員番号</th>
                  <th className="px-4 py-4 font-medium">所属</th>
                  <th className="px-4 py-4 font-medium">役職</th>
                  <th className="px-4 py-4 font-medium">メール</th>
                  <th className="px-4 py-4 font-medium">状態</th>
                  <th className="px-4 py-4 font-medium">アカウント</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id} className="border-t border-slate-100 align-top">
                    <td className="px-6 py-4">
                      <Link href={`/employees/${employee.id}?tab=basic`} className="font-semibold text-slate-900 no-underline hover:text-indigo-700">
                        {employee.name}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{employee.employeeCode}</td>
                    <td className="px-4 py-4 text-slate-600">{employee.departmentName || employee.branchName || "-"}</td>
                    <td className="px-4 py-4 text-slate-600">{employee.positionName || "-"}</td>
                    <td className="px-4 py-4 text-slate-600">{employee.email || "-"}</td>
                    <td className="px-4 py-4"><StatusPill status={employee.status} /></td>
                    <td className="px-4 py-4">
                      <InviteEmployeeButton employeeId={employee.id} email={employee.email || ""} hasUserId={!!employee.userId} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 text-sm text-slate-600">
          <div>ページ {pagination.page} / {pagination.totalPages}</div>
          <div className="flex items-center gap-2">
            <PageButton disabled={pagination.page <= 1} href={hrefForPage(pagination.page - 1)} label="前へ" />
            <PageButton disabled={pagination.page >= pagination.totalPages} href={hrefForPage(pagination.page + 1)} label="次へ" />
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <SummaryCard title="詳細条件" description="現在の一覧から集計したサマリーです。フィルタ適用後の結果をそのまま反映します。">
          <div className="space-y-3 text-sm">
            <SummaryRow label="在籍" value={String(employees.filter((item) => item.status === "active").length)} />
            <SummaryRow label="休職" value={String(employees.filter((item) => item.status === "leave").length)} />
            <SummaryRow label="退職/無効" value={String(employees.filter((item) => item.status === "inactive").length)} />
          </div>
        </SummaryCard>

        <SummaryCard title="所属" description="部署別の表示件数です。">
          <div className="space-y-3">
            {renderCountMap(departmentCounts)}
          </div>
        </SummaryCard>

        <SummaryCard title="拠点" description="支店別の表示件数です。">
          <div className="space-y-3">
            {renderCountMap(branchCounts)}
          </div>
        </SummaryCard>
      </aside>
    </div>
  );
}

function renderCountMap(values: Record<string, number>) {
  const entries = Object.entries(values).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return <div className="text-sm text-slate-500">データがありません。</div>;

  return entries.map(([label, count]) => (
    <div key={label} className="flex items-center justify-between text-sm">
      <span className="text-slate-700">{label}</span>
      <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">{count}</span>
    </div>
  ));
}

function SummaryCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <div className="text-xs font-bold tracking-[0.16em] text-indigo-600">{title}</div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">{value}</span>
    </div>
  );
}

function PageButton({ disabled, href, label }: { disabled: boolean; href: string; label: string }) {
  if (disabled) return <span className="rounded-xl border border-slate-200 px-3 py-2 text-slate-300">{label}</span>;
  return <Link href={href} className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700 no-underline hover:border-indigo-300 hover:text-indigo-700">{label}</Link>;
}

function buttonClass(active: boolean) {
  return [
    "rounded-full px-3 py-1.5 text-sm font-semibold transition",
    active ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700",
  ].join(" ");
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="min-w-12 text-slate-400">{label}</dt>
      <dd className="m-0 flex-1 text-right text-slate-700">{value}</dd>
    </div>
  );
}

function StatusDot({ status }: { status: EmployeeListItem["status"] }) {
  return <span className="mt-1 inline-flex h-3.5 w-3.5 rounded-full" style={{ backgroundColor: statusTone[status] }} />;
}

function StatusPill({ status }: { status: EmployeeListItem["status"] }) {
  return (
    <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold" style={{ color: statusTone[status], borderColor: `${statusTone[status]}33`, background: `${statusTone[status]}12` }}>
      {statusLabel[status]}
    </span>
  );
}