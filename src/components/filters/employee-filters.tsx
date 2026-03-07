"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Me } from "@/types/api";

export function EmployeeFilters({
  me,
  initial,
}: {
  me: Me;
  initial: Record<string, string | string[] | undefined>;
}) {
  void me;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const keyword = useMemo(() => {
    const value = initial.keyword;
    return typeof value === "string" ? value : "";
  }, [initial.keyword]);

  function updateQuery(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(next).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    if (Object.keys(next).some((k) => k !== "page")) {
      params.set("page", "1");
    }

    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <label className="flex-1 space-y-1.5">
          <span className="text-sm font-medium text-slate-700">キーワード</span>
          <input
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            placeholder="氏名・社員番号・メールで検索"
            defaultValue={keyword}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              updateQuery({ keyword: (e.currentTarget as HTMLInputElement).value.trim() });
            }}
          />
        </label>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={(e) => {
              const root = (e.currentTarget.closest("section") as HTMLElement | null) ?? document.body;
              const input = root.querySelector("input") as HTMLInputElement | null;
              updateQuery({ keyword: input?.value.trim() ?? "" });
            }}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            検索
          </button>
          <button
            type="button"
            onClick={() => router.push(pathname)}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            クリア
          </button>
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500">※ 支店・部署などの詳細フィルターは順次追加予定です。</p>
    </section>
  );
}