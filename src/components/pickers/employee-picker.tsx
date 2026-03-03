// src/components/pickers/employee-picker.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type EmployeeOption = {
  id: string;
  name: string;
  employeeCode: string;
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
        params.set("limit", "20");

        const res = await fetch(`/api/employees?${params.toString()}`);
        const json = await res.json();
        if (!active) return;

        const mapped = (json?.data?.items ?? []).map((x: any) => ({
          id: x.id,
          name: x.name,
          employeeCode: x.employeeCode,
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
    return found ? `${found.name}（${found.employeeCode}）` : "";
  }, [items, value]);

  return (
    <div className="space-y-1">
      <div className="text-sm font-medium">{label}</div>

      <input
        className="border rounded p-2 w-full"
        placeholder="氏名や社員番号で検索"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />

      <select
        className="border rounded p-2 w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{loading ? "読み込み中..." : "選択してください"}</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}（{item.employeeCode}）
          </option>
        ))}
      </select>

      {value && selectedLabel && (
        <div className="text-xs text-gray-600">選択中：{selectedLabel}</div>
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