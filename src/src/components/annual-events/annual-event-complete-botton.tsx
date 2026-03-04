// src/components/annual-events/annual-event-complete-button.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AnnualEventCompleteButton({
  eventId,
  disabled,
}: {
  eventId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleComplete() {
    if (!confirm("このイベントを完了にしますか？")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/annual-events/${eventId}/complete`, {
        method: "POST",
      });

      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message ?? "完了化に失敗しました");
      }

      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? "完了化に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleComplete}
      disabled={disabled || loading}
      className="px-4 py-2 rounded border bg-black text-white text-sm disabled:opacity-50"
    >
      {loading ? "更新中..." : "完了にする"}
    </button>
  );
}