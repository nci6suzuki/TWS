// src/components/selects/branch-select.tsx
"use client";

import { useEffect, useState } from "react";

type Item = { id: string; name: string };

export function BranchSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const selectClassName =
    "h-11 min-w-0 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

  useEffect(() => {
    fetch("/api/masters/branches")
      .then((res) => res.json())
      .then((json) => setItems(json?.data?.items ?? []));
  }, []);

  return (
    <select className={selectClassName} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">支店を選択</option>
      {items.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name}
        </option>
      ))}
    </select>
  );
}