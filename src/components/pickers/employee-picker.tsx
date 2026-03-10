// src/components/pickers/employee-picker.tsx
"use client";

import { CSSProperties, useEffect, useMemo, useState } from "react";

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
    <div style={{ minWidth: 0, display: "grid", gap: 6 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>{label}</div>

      <input
        style={pickerControlStyle}
        placeholder="氏名や社員番号で検索"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />

      <select
        style={pickerControlStyle}
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
        <div style={{ fontSize: 12, color: "#64748b" }}>選択中：{selectedLabel}</div>
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

const pickerControlStyle: CSSProperties = {
  width: "100%",
  height: 42,
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  padding: "0 12px",
  fontSize: 14,
  color: "#0f172a",
  background: "#fff",
  boxSizing: "border-box",
};