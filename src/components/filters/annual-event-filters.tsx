// src/components/filters/annual-event-filters.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function AnnualEventFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [fiscalYear, setFiscalYear] = useState(searchParams.get("fiscalYear") ?? "");
  const [eventType, setEventType] = useState(searchParams.get("eventType") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [keyword, setKeyword] = useState(searchParams.get("keyword") ?? "");

  function apply() {
    const params = new URLSearchParams();

    if (fiscalYear) params.set("fiscalYear", fiscalYear);
    if (eventType) params.set("eventType", eventType);
    if (status) params.set("status", status);
    if (keyword) params.set("keyword", keyword);

    router.push(`/annual-events?${params.toString()}`);
  }

  function reset() {
    router.push("/annual-events");
  }

  return (
    <div className="border rounded p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
      <input
        className="border rounded p-2"
        placeholder="年度（例: 2026）"
        value={fiscalYear}
        onChange={(e) => setFiscalYear(e.target.value)}
      />

      <select
        className="border rounded p-2"
        value={eventType}
        onChange={(e) => setEventType(e.target.value)}
      >
        <option value="">種別すべて</option>
        <option value="interview">面談</option>
        <option value="training">研修</option>
        <option value="evaluation">評価</option>
        <option value="other">その他</option>
      </select>

      <select
        className="border rounded p-2"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        <option value="">状態すべて</option>
        <option value="pending">未実施</option>
        <option value="done">完了</option>
        <option value="cancelled">中止</option>
      </select>

      <input
        className="border rounded p-2"
        placeholder="社員名 / タイトル"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />

      <div className="md:col-span-4 flex gap-2">
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