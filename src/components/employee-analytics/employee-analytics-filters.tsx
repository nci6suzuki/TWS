// src/components/employee-analytics/employee-analytics-filters.tsx

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { buttonClassName } from "@/lib/ui/button-class";

export function EmployeeAnalyticsFilters({
  status,
  gender,
  management,
  employmentType,
}: {
  status: string;
  gender: string;
  management: string;
  employmentType: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function applyFilters(formData: FormData) {
    const p = new URLSearchParams();

    const nextStatus = String(formData.get("status") ?? "active");
    const nextGender = String(formData.get("gender") ?? "all");
    const nextManagement = String(formData.get("management") ?? "all");
    const nextEmploymentType = String(formData.get("employment_type") ?? "all");

    if (nextStatus !== "active") p.set("status", nextStatus);
    if (nextGender !== "all") p.set("gender", nextGender);
    if (nextManagement !== "all") p.set("management", nextManagement);
    if (nextEmploymentType !== "all") {
      p.set("employment_type", nextEmploymentType);
    }

    const qs = p.toString();

    startTransition(() => {
      router.push(qs ? `/employee-analytics?${qs}` : "/employee-analytics");
    });
  }

  return (
    <form
      action={applyFilters}
      className="grid grid-cols-1 gap-3 md:grid-cols-5"
    >
      <Select
        label="在籍状態"
        name="status"
        defaultValue={status}
        options={[
          ["active", "在籍中"],
          ["all", "すべて"],
          ["leave", "休職中"],
          ["inactive", "退職・無効"],
        ]}
      />

      <Select
        label="性別"
        name="gender"
        defaultValue={gender}
        options={[
          ["all", "すべて"],
          ["male", "男性"],
          ["female", "女性"],
          ["other", "その他"],
          ["unknown", "未設定"],
        ]}
      />

      <Select
        label="役職者"
        name="management"
        defaultValue={management}
        options={[
          ["all", "すべて"],
          ["management", "役職者のみ"],
          ["non_management", "役職者以外"],
        ]}
      />

      <Select
        label="雇用区分"
        name="employment_type"
        defaultValue={employmentType}
        options={[
          ["all", "すべて"],
          ["full_time", "正社員"],
          ["contract", "契約社員"],
          ["part_time", "パート"],
          ["other", "その他"],
          ["unknown", "未設定"],
        ]}
      />

      <div className="flex items-end gap-2">
        <button
          type="submit"
          disabled={pending}
          aria-disabled={pending}
          className={buttonClassName(
            "inline-flex h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-black text-white hover:bg-slate-800",
            { loading: pending }
          )}
        >
          {pending ? "絞り込み中..." : "絞り込み"}
        </button>

        <Link
          href="/employee-analytics"
          className={buttonClassName(
            "inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 hover:bg-slate-50"
          )}
        >
          リセット
        </Link>
      </div>
    </form>
  );
}

function Select({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: Array<[string, string]>;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black text-slate-500">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
      >
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}