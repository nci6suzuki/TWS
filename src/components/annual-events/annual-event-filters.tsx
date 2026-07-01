// src/components/annual-events/annual-event-filters.tsx

"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SubmitButton } from "@/components/ui/submit-button";

type Form = {
  status: string;
  eventType: string;
  year: string;
  month: string;
  keyword: string;
  overdue: string;
};

export function AnnualEventFilters() {
  const router = useRouter();
  const sp = useSearchParams();

  const employeeCode = sp.get("employeeCode") ?? "";
  const view = sp.get("view") ?? "cards";

  const init = useMemo<Form>(() => {
    return {
      status: sp.get("status") ?? "",
      eventType: sp.get("type") ?? "",
      year: sp.get("year") ?? "",
      month: sp.get("month") ?? "",
      keyword: sp.get("q") ?? "",
      overdue: sp.get("overdue") ?? "",
    };
  }, [sp]);

  const [form, setForm] = useState<Form>(init);

  function buildUrl(nextForm: Form) {
    const p = new URLSearchParams();

    if (nextForm.status) p.set("status", nextForm.status);
    if (nextForm.eventType) p.set("type", nextForm.eventType);
    if (nextForm.year) p.set("year", nextForm.year);
    if (nextForm.month) p.set("month", nextForm.month);
    if (nextForm.keyword) p.set("q", nextForm.keyword);
    if (nextForm.overdue) p.set("overdue", nextForm.overdue);

    if (employeeCode) p.set("employeeCode", employeeCode);
    if (view) p.set("view", view);

    const qs = p.toString();
    return qs ? `/annual-events?${qs}` : "/annual-events";
  }

  function apply() {
    router.push(buildUrl(form));
  }

  function reset() {
    const p = new URLSearchParams();

    if (employeeCode) p.set("employeeCode", employeeCode);
    if (view) p.set("view", view);

    const qs = p.toString();
    router.push(qs ? `/annual-events?${qs}` : "/annual-events");
  }

  function applyQuick(nextForm: Form) {
    setForm(nextForm);
    router.push(buildUrl(nextForm));
  }

  return (
    <div className="rounded-2xl border bg-white p-4 space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        <input
          className="input"
          placeholder="キーワード（タイトル）"
          value={form.keyword}
          onChange={(e) =>
            setForm((v) => ({ ...v, keyword: e.target.value }))
          }
        />

        <select
          className="input"
          value={form.status}
          onChange={(e) =>
            setForm((v) => ({
              ...v,
              status: e.target.value,
              overdue: e.target.value ? "" : v.overdue,
            }))
          }
        >
          <option value="">状態すべて</option>
          <option value="pending">未完了</option>
          <option value="done">完了済み</option>
          <option value="canceled">中止</option>
        </select>

        <select
          className="input"
          value={form.eventType}
          onChange={(e) =>
            setForm((v) => ({ ...v, eventType: e.target.value }))
          }
        >
          <option value="">種別すべて</option>
          <option value="interview">面談</option>
          <option value="training">研修</option>
          <option value="evaluation">評価</option>
          <option value="qualification">資格</option>
          <option value="contract">契約・更新</option>
          <option value="onboarding">onboarding</option>
          <option value="other">その他</option>
        </select>

        <select
          className="input"
          value={form.month}
          onChange={(e) => setForm((v) => ({ ...v, month: e.target.value }))}
        >
          <option value="">月指定なし</option>
          <option value="this">今月</option>
          <option value="next">来月</option>
        </select>

        <input
          className="input"
          placeholder="年度（例: 2026）"
          value={form.year}
          onChange={(e) => setForm((v) => ({ ...v, year: e.target.value }))}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <SubmitButton
  pendingText="絞り込み中..."
  className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-black text-white transition hover:bg-slate-800"
>
  絞り込み
</SubmitButton>

        <button
          type="button"
          onClick={reset}
          className="inline-flex h-10 items-center rounded-xl border bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          リセット
        </button>

        <QuickChip
          active={form.month === "this"}
          label="今月"
          onClick={() =>
            applyQuick({
              ...form,
              month: form.month === "this" ? "" : "this",
            })
          }
        />

        <QuickChip
          active={form.month === "next"}
          label="来月"
          onClick={() =>
            applyQuick({
              ...form,
              month: form.month === "next" ? "" : "next",
            })
          }
        />

        <QuickChip
          active={form.status === "pending" && form.overdue !== "1"}
          label="未完了のみ"
          onClick={() =>
            applyQuick({
              ...form,
              status: form.status === "pending" ? "" : "pending",
              overdue: "",
            })
          }
        />

        <QuickChip
          active={form.status === "done"}
          label="完了済み"
          onClick={() =>
            applyQuick({
              ...form,
              status: form.status === "done" ? "" : "done",
              overdue: "",
            })
          }
        />

        <QuickChip
          active={form.overdue === "1"}
          label="期限超過だけ"
          onClick={() =>
            applyQuick({
              ...form,
              overdue: form.overdue === "1" ? "" : "1",
              status: form.overdue === "1" ? form.status : "pending",
            })
          }
        />
      </div>
    </div>
  );
}

function QuickChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "h-10 rounded-xl border px-4 text-sm font-semibold",
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "bg-white text-slate-700 hover:bg-slate-50",
      ].join(" ")}
    >
      {label}
    </button>
  );
}