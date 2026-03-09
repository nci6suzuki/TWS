// src/components/pickers/employee-picker.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type EmployeeOption = {
  id: string;
  name: string;
  employeeCode: string;
  branchName: string;
  departmentName: string;
};

export function EmployeePicker({
  value,
  onChange,
  label = "社員",
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  const [keyword, setKeyword] = useState("");
  const [items, setItems] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(false);

  const debouncedKeyword = useDebouncedValue(keyword, 300);
  const controlClassName =
    "h-11 min-w-0 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

  useEffect(() => {
    let active = true;

    async function fetchEmployees() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (debouncedKeyword) params.set("keyword", debouncedKeyword);
        params.set("page", "1");
        params.set("limit", "1000");

        const res = await fetch(`/api/employees?${params.toString()}`);
        const json = await res.json();
        if (!active) return;

        const mapped = (json?.data?.items ?? []).map((x: any) => ({
          id: x.id,
          name: x.name,
          employeeCode: x.employeeCode ?? x.employee_code ?? "",
          branchName: x.branchName ?? x.branches?.name ?? "",
          departmentName: x.departmentName ?? x.departments?.name ?? "",
        }));
        setItems(mapped);
      } catch {
        if (active) setItems([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchEmployees();
    return () => {
      active = false;
    };
  }, [debouncedKeyword]);

  const selectedLabel = useMemo(() => {
    const found = items.find((item) => item.id === value);
    if (!found) return "";

    const org = [found.branchName, found.departmentName].filter(Boolean).join(" / ");
    return org
      ? `${found.name}（${found.employeeCode}｜${org}）`
      : `${found.name}（${found.employeeCode}）`;
  }, [items, value]);

  return (
    <div className="min-w-0 space-y-1.5">
      <div className="text-sm font-medium text-slate-700">{label}</div>

      <input
        className={controlClassName}
        placeholder="氏名や社員番号で検索"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />

      <select
        className={controlClassName}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{loading ? "読み込み中..." : "選択してください"}</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}（{item.employeeCode}
            {item.branchName || item.departmentName
              ? `｜${[item.branchName, item.departmentName].filter(Boolean).join(" / ")}`
              : ""}
            ）
          </option>
        ))}
      </select>

      {value && selectedLabel && (
        <div className="text-xs text-slate-500">選択中：{selectedLabel}</div>
      )}
    </div>
  );
}

function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [value, delay]);

  return debounced;
}