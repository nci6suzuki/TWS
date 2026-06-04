// src/components/filters/annual-event-filters.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { Me } from "@/types/api";

type Props = {
  me: Me;
  initial: Record<string, string | undefined>;
};

export function AnnualEventFilters({ me, initial }: Props) {
  const router = useRouter();
  const sp = useSearchParams();

  // 初期値（URL優先→initial）
  const init = useMemo(() => {
    const get = (k: string) => sp.get(k) ?? initial[k] ?? "";
    return {
      employeeId: get("employeeId"),
      fiscalYear: get("fiscalYear"),
      eventType: get("eventType"),
      status: get("status"),
      keyword: get("keyword"),
    };
  }, [sp, initial]);

  const [form, setForm] = useState(init);

  function apply() {
    const params = new URLSearchParams();

    if (form.employeeId) params.set("employeeId", form.employeeId);
    if (form.fiscalYear) params.set("fiscalYear", form.fiscalYear);
    if (form.eventType) params.set("eventType", form.eventType);
    if (form.status) params.set("status", form.status);
    if (form.keyword) params.set("keyword", form.keyword);

    router.push(`/annual-events?${params.toString()}`);
  }

  function reset() {
    router.push("/annual-events");
  }

  return (
    <div className="rounded-2xl border bg-white p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <input
          className="border rounded-xl p-2 text-sm"
          placeholder="社員ID（任意）"
          value={form.employeeId}
          onChange={(e) => setForm((v) => ({ ...v, employeeId: e.target.value }))}
        />
        <input
          className="border rounded-xl p-2 text-sm"
          placeholder="年度（例: 2026）"
          value={form.fiscalYear}
          onChange={(e) => setForm((v) => ({ ...v, fiscalYear: e.target.value }))}
        />
        <input
          className="border rounded-xl p-2 text-sm"
          placeholder="種別（interview等）"
          value={form.eventType}
          onChange={(e) => setForm((v) => ({ ...v, eventType: e.target.value }))}
        />
        <input
          className="border rounded-xl p-2 text-sm"
          placeholder="状態（pending/done等）"
          value={form.status}
          onChange={(e) => setForm((v) => ({ ...v, status: e.target.value }))}
        />
        <input
          className="border rounded-xl p-2 text-sm"
          placeholder="キーワード"
          value={form.keyword}
          onChange={(e) => setForm((v) => ({ ...v, keyword: e.target.value }))}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={apply}
          className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
        >
          絞り込む
        </button>
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-10 items-center rounded-xl border bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          リセット
        </button>
      </div>

      {/* me は今後、社員ピッカーや権限制御に使える（現時点では未使用でもOK） */}
    </div>
  );
}