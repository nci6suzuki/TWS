// src/components/ui/complete-action-button.tsx

"use client";

import { useState } from "react";
import { buttonClassName } from "@/lib/ui/button-class";

type CompleteActionButtonProps = {
  confirmMessage?: string;
  pendingText?: string;
  children?: React.ReactNode;
  className?: string;
  onComplete: () => Promise<void>;
};

export function CompleteActionButton({
  confirmMessage = "完了にします。よろしいですか？",
  pendingText = "完了処理中...",
  children = "完了化",
  className,
  onComplete,
}: CompleteActionButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;

    const ok = confirm(confirmMessage);
    if (!ok) return;

    setLoading(true);

    try {
      await onComplete();
    } catch (e: any) {
      alert(e?.message ?? "完了処理に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  const baseClassName =
    className ??
    "inline-flex h-8 items-center justify-center rounded-lg bg-emerald-600 px-3 text-xs font-black text-white hover:bg-emerald-700";

  return (
    <button
      type="button"
      disabled={loading}
      aria-disabled={loading}
      onClick={handleClick}
      className={buttonClassName(baseClassName, {
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