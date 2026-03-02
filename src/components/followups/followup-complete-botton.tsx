// src/components/followups/followup-complete-button.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function FollowupCompleteButton({
  followupId,
  disabled,
}: {
  followupId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleComplete() {
    if (!confirm("このフォロー割当を完了にしますか？")) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/followups/${followupId}/complete`, {
        method: "POST",
      });
      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message ?? "完了化に失敗しました");
      }

      router.refresh();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "完了化に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleComplete}
        disabled={disabled || loading}
        className="px-4 py-2 rounded border bg-black text-white text-sm disabled:opacity-50"
      >
        {loading ? "更新中..." : "完了にする"}
      </button>
      {errorMsg && <div className="text-xs text-red-600">{errorMsg}</div>}
    </div>
  );
}