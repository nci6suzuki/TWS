"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function AuditLogFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tableName, setTableName] = useState(searchParams.get("tableName") ?? "");
  const [action, setAction] = useState(searchParams.get("action") ?? "");

  function apply() {
    const params = new URLSearchParams();

    if (tableName) params.set("tableName", tableName);
    if (action) params.set("action", action);

    router.push(`/settings/audit-logs?${params.toString()}`);
  }

  function reset() {
    router.push("/settings/audit-logs");
  }

  return (
    <div className="border rounded p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
      <input
        className="border rounded p-2"
        placeholder="テーブル名（例: employees）"
        value={tableName}
        onChange={(e) => setTableName(e.target.value)}
      />

      <select
        className="border rounded p-2"
        value={action}
        onChange={(e) => setAction(e.target.value)}
      >
        <option value="">操作すべて</option>
        <option value="INSERT">INSERT</option>
        <option value="UPDATE">UPDATE</option>
        <option value="DELETE">DELETE</option>
      </select>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={apply}
          className="px-4 py-2 rounded border bg-black text-white text-sm"
        >
          絞り込む
        </button>
        <button
          type="button"
          onClick={reset}
          className="px-4 py-2 rounded border text-sm"
        >
          リセット
        </button>
      </div>
    </div>
  );
}