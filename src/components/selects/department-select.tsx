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

  useEffect(() => {
    const url = branchId
      ? `/api/masters/departments?branchId=${branchId}`
      : "/api/masters/departments";

    fetch(url)
      .then((res) => res.json())
      .then((json) => setItems(json?.data?.items ?? []));
  }, [branchId]);

  return (
    <select className="border rounded p-2 w-full" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">部署を選択</option>
      {items.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name}
        </option>
      ))}
    </select>
  );
}