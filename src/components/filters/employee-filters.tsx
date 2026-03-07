"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Me } from "@/types/api";
import { Card, CardText, CardTitle } from "@/components/ui/card";

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

  const initialKeyword = useMemo(() => {
    const value = initial.keyword;
    return typeof value === "string" ? value : "";
  }, [initial.keyword]);
  const [keyword, setKeyword] = useState(initialKeyword);

  useEffect(() => {
    setKeyword(initialKeyword);
  }, [initialKeyword]);

  function updateQuery(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(next).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });

    if (Object.keys(next).some((k) => k !== "page")) {
      params.set("page", "1");
    }

    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Card variant="default" style={{ padding: 0 }}>
      <section className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <CardTitle style={{ fontSize: 17 }}>🔎 フィルター</CardTitle>
            <CardText style={{ marginTop: 8, fontSize: 13 }}>
              キーワードで社員情報をすばやく絞り込みできます。
            </CardText>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <label className="flex-1 space-y-1.5">
            <span className="text-sm font-medium text-slate-700">キーワード</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              placeholder="氏名・社員番号・メールで検索"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  updateQuery({ keyword: keyword.trim() });
                }
              }}
            />
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => updateQuery({ keyword: keyword.trim() })}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              検索
            </button>
            <button
              type="button"
              onClick={() => {
                setKeyword("");
                router.push(pathname);
              }}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              クリア
            </button>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500">※ 支店・部署などの詳細フィルターは順次追加予定です。</p>
      </section>
    </Card>
  );
}