// src/components/ui/delete-submit-button.tsx

"use client";

import { useFormStatus } from "react-dom";
import { buttonClassName } from "@/lib/ui/button-class";

type DeleteSubmitButtonProps = {
  children?: React.ReactNode;
  pendingText?: string;
  confirmMessage?: string;
  className?: string;
  disabled?: boolean;
};

export function DeleteSubmitButton({
  children = "削除",
  pendingText = "削除中...",
  confirmMessage = "削除します。元に戻せません。よろしいですか？",
  className,
  disabled = false,
}: DeleteSubmitButtonProps) {
  const { pending } = useFormStatus();

  const baseClassName =
    className ??
    "inline-flex h-8 items-center justify-center rounded-lg bg-rose-600 px-3 text-xs font-black text-white hover:bg-rose-700";

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-disabled={pending || disabled}
      onClick={(e) => {
        if (pending || disabled) {
          e.preventDefault();
          return;
        }

        const ok = confirm(confirmMessage);

        if (!ok) {
          e.preventDefault();
        }
      }}
      className={buttonClassName(baseClassName, {
        disabled,
        loading: pending,
      })}
    >
      {pending ? (
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