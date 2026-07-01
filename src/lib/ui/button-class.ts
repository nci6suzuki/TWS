// src/lib/ui/button-class.ts

export function buttonClassName(
  baseClassName: string,
  options?: {
    disabled?: boolean;
    loading?: boolean;
  }
) {
  const disabled = options?.disabled ?? false;
  const loading = options?.loading ?? false;

  return [
    baseClassName,
    "transition",
    "duration-150",
    "ease-out",
    "active:scale-[0.98]",
    "active:translate-y-px",
    "focus:outline-none",
    "focus-visible:ring-2",
    "focus-visible:ring-indigo-500",
    "focus-visible:ring-offset-2",
    disabled || loading
      ? "cursor-not-allowed opacity-60 active:scale-100 active:translate-y-0"
      : "cursor-pointer",
  ].join(" ");
}