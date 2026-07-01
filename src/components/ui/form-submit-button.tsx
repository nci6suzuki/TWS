// src/components/ui/form-submit-button.tsx

"use client";

import { useState } from "react";

type FormSubmitButtonProps = {
  form?: string;
  children?: React.ReactNode;
  pendingText?: string;
  className?: string;
  disabled?: boolean;
};

export function FormSubmitButton({
  form,
  children = "更新",
  pendingText = "更新中...",
  className,
  disabled = false,
}: FormSubmitButtonProps) {
  const [loading, setLoading] = useState(false);

  return (
    <button
      form={form}
      type="submit"
      disabled={loading || disabled}
      aria-disabled={loading || disabled}
      onClick={() => {
        if (!loading && !disabled) {
          setLoading(true);
        }
      }}
      className={[
        className ??
          "inline-flex h-8 items-center justify-center rounded-lg bg-slate-900 px-3 text-xs font-black text-white transition hover:bg-slate-800",
        loading || disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
      ].join(" ")}
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