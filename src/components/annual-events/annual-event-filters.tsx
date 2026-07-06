// src/components/annual-events/annual-event-filters.tsx

"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { buttonClassName } from "@/lib/ui/button-class";

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
  const [isPending, startTransition] = useTransition();

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
  const [pendingAction, setPendingAction] = useState<
    "apply" | "reset" | "thisMonth" | "nextMonth" | "pending" | "done" | "overdue" | ""
  >("");

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

  function moveTo(url: string, action: typeof pendingAction) {
    setPendingAction(action);

    startTransition(() => {
      router.push(url);
    });
  }

  function apply() {
    moveTo(buildUrl(form), "apply");
  }

  function reset() {
    const p = new URLSearchParams();

    if (employeeCode) p.set("employeeCode", employeeCode);
    if (view) p.set("view", view);

    const qs = p.toString();
    moveTo(qs ? `/annual-events?${qs}` : "/annual-events", "reset");
  }

  function applyQuick(nextForm: Form, action: typeof pendingAction) {
    setForm(nextForm);
    moveTo(buildUrl(nextForm), action);
  }

  const disabled = isPending;

  return (
    <div className="space-y-3 rounded-2xl border bg-white p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        <input
          className="input"
          placeholder="キーワード（タイトル）"
          value={form.keyword}
          disabled={disabled}
          onChange={(e) =>
            setForm((v) => ({ ...v, keyword: e.target.value }))
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              apply();
            }
          }}
        />

        <select
          className="input"
          value={form.status}
          disabled={disabled}
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
          disabled={disabled}
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
          disabled={disabled}
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
          disabled={disabled}
          onChange={(e) => setForm((v) => ({ ...v, year: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              apply();
            }
          }}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterButton
          loading={isPending && pendingAction === "apply"}
          disabled={disabled}
          pendingText="絞り込み中..."
          onClick={apply}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-black text-white hover:bg-slate-800"
        >
          絞り込み
        </FilterButton>

        <FilterButton
          loading={isPending && pendingAction === "reset"}
          disabled={disabled}
          pendingText="リセット中..."
          onClick={reset}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
        >
          リセット
        </FilterButton>

        <QuickChip
          active={form.month === "this"}
          loading={isPending && pendingAction === "thisMonth"}
          disabled={disabled}
          label="今月"
          pendingLabel="表示中..."
          onClick={() =>
            applyQuick(
              {
                ...form,
                month: form.month === "this" ? "" : "this",
              },
              "thisMonth"
            )
          }
        />

        <QuickChip
          active={form.month === "next"}
          loading={isPending && pendingAction === "nextMonth"}
          disabled={disabled}
          label="来月"
          pendingLabel="表示中..."
          onClick={() =>
            applyQuick(
              {
                ...form,
                month: form.month === "next" ? "" : "next",
              },
              "nextMonth"
            )
          }
        />

        <QuickChip
          active={form.status === "pending" && form.overdue !== "1"}
          loading={isPending && pendingAction === "pending"}
          disabled={disabled}
          label="未完了のみ"
          pendingLabel="表示中..."
          onClick={() =>
            applyQuick(
              {
                ...form,
                status: form.status === "pending" ? "" : "pending",
                overdue: "",
              },
              "pending"
            )
          }
        />

        <QuickChip
          active={form.status === "done"}
          loading={isPending && pendingAction === "done"}
          disabled={disabled}
          label="完了済み"
          pendingLabel="表示中..."
          onClick={() =>
            applyQuick(
              {
                ...form,
                status: form.status === "done" ? "" : "done",
                overdue: "",
              },
              "done"
            )
          }
        />

        <QuickChip
          active={form.overdue === "1"}
          loading={isPending && pendingAction === "overdue"}
          disabled={disabled}
          label="期限超過だけ"
          pendingLabel="表示中..."
          onClick={() =>
            applyQuick(
              {
                ...form,
                overdue: form.overdue === "1" ? "" : "1",
                status: form.overdue === "1" ? form.status : "pending",
              },
              "overdue"
            )
          }
        />
      </div>
    </div>
  );
}

function FilterButton({
  children,
  loading,
  disabled,
  pendingText,
  onClick,
  className,
}: {
  children: React.ReactNode;
  loading: boolean;
  disabled: boolean;
  pendingText: string;
  onClick: () => void;
  className: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-disabled={disabled}
      onClick={() => {
        if (!disabled) onClick();
      }}
      className={buttonClassName(className, {
        disabled,
        loading,
      })}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          {pendingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
}

function QuickChip({
  active,
  label,
  pendingLabel,
  loading,
  disabled,
  onClick,
}: {
  active: boolean;
  label: string;
  pendingLabel: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-disabled={disabled}
      onClick={() => {
        if (!disabled) onClick();
      }}
      className={buttonClassName(
        [
          "inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-black",
          active
            ? "border-slate-900 bg-slate-900 text-white"
            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
        ].join(" "),
        {
          disabled,
          loading,
        }
      )}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span
            className={[
              "h-3.5 w-3.5 animate-spin rounded-full border-2",
              active
                ? "border-white/40 border-t-white"
                : "border-slate-300 border-t-slate-700",
            ].join(" ")}
          />
          {pendingLabel}
        </span>
      ) : (
        label
      )}
    </button>
  );
}