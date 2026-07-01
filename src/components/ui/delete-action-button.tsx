// src/components/ui/delete-action-button.tsx

"use client";

import { useState } from "react";
import { buttonClassName } from "@/lib/ui/button-class";

type DeleteActionButtonProps = {
  confirmMessage?: string;
  pendingText?: string;
  children?: React.ReactNode;
  className?: string;
  onDelete: () => Promise<void>;
};

export function DeleteActionButton({
  confirmMessage = "削除します。元に戻せません。よろしいですか？",
  pendingText = "削除中...",
  children = "削除",
  className,
  onDelete,
}: DeleteActionButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;

    const ok = confirm(confirmMessage);
    if (!ok) return;

    setLoading(true);

    try {
      await onDelete();
    } catch (e: any) {
      alert(e?.message ?? "削除に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  const baseClassName =
    className ??
    "inline-flex h-8 items-center justify-center rounded-lg bg-rose-600 px-3 text-xs font-black text-white hover:bg-rose-700";

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