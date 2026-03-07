// src/components/selects/department-select.tsx
"use client";

import { useEffect, useState } from "react";

type Item = { id: string; name: string };

export function DepartmentSelect({
  branchId,
  value,
  onChange,
}: {
  branchId?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const selectClassName =
    "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

  useEffect(() => {
    const url = branchId
      ? `/api/masters/departments?branchId=${branchId}`
      : "/api/masters/departments";

    fetch(url)
      .then((res) => res.json())
      .then((json) => setItems(json?.data?.items ?? []));
  }, [branchId]);

  return (
    <select className={selectClassName} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">部署を選択</option>
      {items.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name}
        </option>
      ))}
    </select>
  );
}