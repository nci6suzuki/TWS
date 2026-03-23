"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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

  const departmentCounts = useMemo(() => {
    return employees.reduce<Record<string, number>>((acc, employee) => {
      const key = employee.departmentName || "未設定";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  }, [employees]);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-5">
          <div>
            <div className="text-sm text-slate-500">メンバー</div>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">{pagination.total}人</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={buttonClass(viewMode === "grid")}
              >
                グリッド
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={buttonClass(viewMode === "list")}
              >
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
      </section>

      <aside className="space-y-4">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
          <div className="text-xs font-bold tracking-[0.16em] text-indigo-600">詳細条件</div>
          <h3 className="mt-2 text-lg font-bold text-slate-900">絞り込みサマリー</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            現在の一覧から、所属ごとの人数を確認できます。今後は役職・等級などの詳細条件もここに追加しやすい構成です。
          </p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
          <h3 className="text-lg font-bold text-slate-900">所属</h3>
          <div className="mt-4 space-y-3">
            {Object.entries(departmentCounts).length === 0 ? (
              <div className="text-sm text-slate-500">データがありません。</div>
            ) : (
              Object.entries(departmentCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([department, count]) => (
                  <div key={department} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{department}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">{count}</span>
                  </div>
                ))
            )}
          </div>
        </div>
      </aside>
    </div>
  );
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