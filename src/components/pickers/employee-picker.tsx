// src/components/pickers/employee-picker.tsx
"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    let active = true;

    async function fetchEmployees() {
      setLoading(true);
      try {
        const res = await fetch(`/api/employees?keyword=${encodeURIComponent(keyword)}&page=1&limit=20`);
        const json = await res.json();
        if (!active) return;

        const mapped = (json?.data?.items ?? []).map((x: any) => ({
          id: x.id,
          name: x.name,
          employeeCode: x.employeeCode,
        }));
        setItems(mapped);
      } catch {
        setItems([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchEmployees();
    return () => {
      active = false;
    };
  }, [keyword]);

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
    </div>
  );
}