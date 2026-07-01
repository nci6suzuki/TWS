// src/components/ui/form-submit-button.tsx

"use client";

import { useState } from "react";
import { buttonClassName } from "@/lib/ui/button-class";

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

  const baseClassName =
    className ??
    "inline-flex h-8 items-center justify-center rounded-lg bg-slate-900 px-3 text-xs font-black text-white hover:bg-slate-800";

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
      className={buttonClassName(baseClassName, {
        disabled,
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