"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Form = {
  status: string;
  eventType: string;
  year: string;
  keyword: string;
};

export function AnnualEventFilters() {
  const router = useRouter();
  const sp = useSearchParams();

  const init = useMemo<Form>(() => {
    return {
      status: sp.get("status") ?? "",       // pending/done/canceled
      eventType: sp.get("type") ?? "",      // onboarding/training/interview/evaluation/other
      year: sp.get("year") ?? "",           // 2026 等
      keyword: sp.get("q") ?? "",
    };
  }, [sp]);

  const [form, setForm] = useState<Form>(init);

  function apply() {
    const p = new URLSearchParams();
    if (form.status) p.set("status", form.status);
    if (form.eventType) p.set("type", form.eventType);
    if (form.year) p.set("year", form.year);
    if (form.keyword) p.set("q", form.keyword);
    router.push(`/annual-events?${p.toString()}`);
  }

  function reset() {
    router.push("/annual-events");
  }

  return (
    <div className="rounded-2xl border bg-white p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <select
          className="rounded-xl border p-3 text-sm bg-white"
          value={form.status}
          onChange={(e) => setForm((v) => ({ ...v, status: e.target.value }))}
        >
          <option value="">状態（全て）</option>
          <option value="pending">未完了（pending）</option>
          <option value="done">完了（done）</option>
          <option value="canceled">中止（canceled）</option>
        </select>

        <select
          className="rounded-xl border p-3 text-sm bg-white"
          value={form.eventType}
          onChange={(e) => setForm((v) => ({ ...v, eventType: e.target.value }))}
        >
          <option value="">種別（全て）</option>
          <option value="onboarding">onboarding</option>
          <option value="training">training</option>
          <option value="interview">interview</option>
          <option value="evaluation">evaluation</option>
          <option value="other">other</option>
        </select>

        <input
          className="rounded-xl border p-3 text-sm"
          placeholder="年度（例: 2026）"
          value={form.year}
          onChange={(e) => setForm((v) => ({ ...v, year: e.target.value }))}
        />

        <input
          className="rounded-xl border p-3 text-sm"
          placeholder="キーワード（タイトル）"
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

        <QuickChip
          active={form.status === "pending"}
          label="未完了のみ"
          onClick={() => setForm((v) => ({ ...v, status: v.status === "pending" ? "" : "pending" }))}
        />
      </div>
    </div>
  );
}

function QuickChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "h-10 rounded-xl px-4 text-sm font-semibold border",
        active ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 hover:bg-slate-50",
      ].join(" ")}
    >
      {label}
    </button>
  );
}