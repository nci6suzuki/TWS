// src/components/ui/submit-button.tsx

"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingText = "処理中...",
  className,
  disabled,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={[
        className ??
          "inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-black text-white hover:bg-slate-800",
        pending || disabled ? "cursor-not-allowed opacity-60" : "",
      ].join(" ")}
    >
      {pending ? pendingText : children}
    </button>
  );
}