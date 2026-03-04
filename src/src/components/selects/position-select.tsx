// src/components/selects/position-select.tsx
"use client";

import { useEffect, useState } from "react";

type Item = { id: string; name: string };

export function PositionSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    fetch("/api/masters/positions")
      .then((res) => res.json())
      .then((json) => setItems(json?.data?.items ?? []));
  }, []);

  return (
    <select className="border rounded p-2 w-full" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">役職を選択</option>
      {items.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name}
        </option>
      ))}
    </select>
  );
}