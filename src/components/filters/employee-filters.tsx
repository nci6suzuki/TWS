"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Me } from "@/types/api";
import { Card, CardText, CardTitle } from "@/components/ui/card";
import { useMasterOptions } from "@/components/forms/use-master-options";

const sortOptions = [
  { value: "name", label: "氏名" },
  { value: "employee_code", label: "社員番号" },
  { value: "status", label: "状態" },
];

const statusOptions = [
  { value: "", label: "すべて" },
  { value: "active", label: "在籍" },
  { value: "leave", label: "休職" },
  { value: "inactive", label: "退職/無効" },
];

const limitOptions = [10, 20, 40, 80];

export function EmployeeFilters({
  me,
  initial,
}: {
  me: Me;
  initial: Record<string, string | string[] | undefined>;
}) {
  void me;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const masterOptions = useMasterOptions(["branches", "departments", "positions", "grades"], {
    branches: [],
    departments: [],
    positions: [],
    grades: [],
  });

  const initialValues = useMemo(
    () => ({
      keyword: typeof initial.keyword === "string" ? initial.keyword : "",
      branchId: typeof initial.branchId === "string" ? initial.branchId : "",
      departmentId: typeof initial.departmentId === "string" ? initial.departmentId : "",
      positionId: typeof initial.positionId === "string" ? initial.positionId : "",
      gradeId: typeof initial.gradeId === "string" ? initial.gradeId : "",
      status: typeof initial.status === "string" ? initial.status : "",
      sort: typeof initial.sort === "string" ? initial.sort : "name",
      order: initial.order === "desc" ? "desc" : "asc",
      limit: typeof initial.limit === "string" ? initial.limit : "20",
    }),
    [initial]
  );
  const [form, setForm] = useState(initialValues);

  useEffect(() => {
    setForm(initialValues);
  }, [initialValues]);

  function updateQuery(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(next).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });

    if (Object.keys(next).some((k) => k !== "page")) {
      params.set("page", "1");
    }

    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Card variant="default" style={{ padding: 0 }}>
      <section className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <CardTitle style={{ fontSize: 17 }}>🔎 メンバーを検索</CardTitle>
            <CardText style={{ marginTop: 8, fontSize: 13 }}>
              氏名検索だけでなく、所属・役職・等級・状態・表示件数・並び順までこの画面で操作できます。
            </CardText>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <FilterField label="キーワード" className="lg:col-span-2">
            <input
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              placeholder="氏名・社員番号・メールで検索"
              value={form.keyword}
              onChange={(e) => setForm((current) => ({ ...current, keyword: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  updateQuery({ ...form, keyword: form.keyword.trim() });
                }
              }}
            />
          </FilterField>

          <FilterField label="状態">
            <select
              className={selectClassName}
              value={form.status}
              onChange={(e) => setForm((current) => ({ ...current, status: e.target.value }))}
            >
              {statusOptions.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="表示件数">
            <select
              className={selectClassName}
              value={form.limit}
              onChange={(e) => setForm((current) => ({ ...current, limit: e.target.value }))}
            >
              {limitOptions.map((value) => (
                <option key={value} value={String(value)}>
                  {value}件
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="支店">
            <select className={selectClassName} value={form.branchId} onChange={(e) => setForm((current) => ({ ...current, branchId: e.target.value }))}>
              <option value="">すべて</option>
              {masterOptions.branches.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </FilterField>

          <FilterField label="部署">
            <select className={selectClassName} value={form.departmentId} onChange={(e) => setForm((current) => ({ ...current, departmentId: e.target.value }))}>
              <option value="">すべて</option>
              {masterOptions.departments.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </FilterField>

          <FilterField label="役職">
            <select className={selectClassName} value={form.positionId} onChange={(e) => setForm((current) => ({ ...current, positionId: e.target.value }))}>
              <option value="">すべて</option>
              {masterOptions.positions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </FilterField>

          <FilterField label="等級">
            <select className={selectClassName} value={form.gradeId} onChange={(e) => setForm((current) => ({ ...current, gradeId: e.target.value }))}>
              <option value="">すべて</option>
              {masterOptions.grades.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </FilterField>

          <FilterField label="並び順">
            <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-2">
              <select className={selectClassName} value={form.sort} onChange={(e) => setForm((current) => ({ ...current, sort: e.target.value }))}>
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <select className={selectClassName} value={form.order} onChange={(e) => setForm((current) => ({ ...current, order: e.target.value }))}>
                <option value="asc">昇順</option>
                <option value="desc">降順</option>
              </select>
            </div>
          </FilterField>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => updateQuery({ ...form, keyword: form.keyword.trim() })}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            条件を適用
          </button>
          <button
            type="button"
            onClick={() => {
              const reset = {
                keyword: "",
                branchId: "",
                departmentId: "",
                positionId: "",
                gradeId: "",
                status: "",
                sort: "name",
                order: "asc",
                limit: "20",
              };
              setForm(reset);
              updateQuery(reset);
            }}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            クリア
          </button>
        </div>
      </section>
    </Card>
  );
}

function FilterField({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <label className={["space-y-1.5", className ?? ""].join(" ")}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

const selectClassName =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";