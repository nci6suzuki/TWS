"use client";

import { useEffect, useMemo, useState } from "react";

export type MasterOptionItem = {
  id?: string;
  value: string;
  label: string;
  sortOrder?: number;
};

export function useMasterOptions(
  categories: string[],
  fallback: Record<string, MasterOptionItem[]>
) {
  const [optionsByCategory, setOptionsByCategory] = useState<Record<string, MasterOptionItem[]>>(fallback);

  const categoryKey = useMemo(() => categories.slice().sort().join(","), [categories]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const params = new URLSearchParams();
        for (const category of categories) {
          params.append("category", category);
        }

        const res = await fetch(`/api/masters/options?${params.toString()}`, {
          cache: "no-store",
        });

        const json = await res.json();
        if (!active || !res.ok || !json?.success) return;

        const grouped = json?.data?.grouped ?? {};
        const merged: Record<string, MasterOptionItem[]> = { ...fallback };

        for (const category of categories) {
          const items = grouped[category];
          if (Array.isArray(items) && items.length > 0) {
            merged[category] = items;
          }
        }

        setOptionsByCategory(merged);
      } catch {
        if (active) {
          setOptionsByCategory(fallback);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [categoryKey]);

  return optionsByCategory;
}