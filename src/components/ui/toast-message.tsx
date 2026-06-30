// src/components/ui/toast-message.tsx

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type ToastType = "success" | "error" | "info" | "warning";

type ToastState = {
  type: ToastType;
  title: string;
  message?: string;
};

export function ToastMessage() {
  const searchParams = useSearchParams();
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    const error = searchParams.get("error");
    const created = searchParams.get("created");
    const updated = searchParams.get("updated");
    const deleted = searchParams.get("deleted");
    const assigned = searchParams.get("assigned");
    const generated = searchParams.get("generated");
    const read = searchParams.get("read");

    if (error) {
      setToast({
        type: "error",
        title: "エラーが発生しました",
        message: error,
      });
      return;
    }

    if (created) {
      setToast({
        type: "success",
        title: "追加しました",
        message: `「${created}」を追加しました。`,
      });
      return;
    }

    if (updated) {
      setToast({
        type: "success",
        title: "更新しました",
        message: `「${updated}」を更新しました。`,
      });
      return;
    }

    if (deleted) {
      setToast({
        type: "warning",
        title: "削除しました",
        message: `「${deleted}」を削除しました。`,
      });
      return;
    }

    if (assigned) {
      setToast({
        type: "success",
        title: "所属を更新しました",
        message: "社員の所属情報を更新しました。",
      });
      return;
    }

    if (generated) {
      setToast({
        type: "success",
        title: "通知を生成しました",
        message: `${generated}件の通知を生成しました。`,
      });
      return;
    }

    if (read) {
      setToast({
        type: "success",
        title: "既読にしました",
        message: "通知を既読にしました。",
      });
      return;
    }

    setToast(null);
  }, [searchParams]);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[9998] w-[calc(100%-2rem)] max-w-sm">
      <div
        className={[
          "pointer-events-auto rounded-2xl border bg-white p-4 shadow-2xl transition",
          toast.type === "success"
            ? "border-emerald-200"
            : toast.type === "error"
              ? "border-rose-200"
              : toast.type === "warning"
                ? "border-amber-200"
                : "border-sky-200",
        ].join(" ")}
      >
        <div className="flex items-start gap-3">
          <div
            className={[
              "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black text-white",
              toast.type === "success"
                ? "bg-emerald-500"
                : toast.type === "error"
                  ? "bg-rose-500"
                  : toast.type === "warning"
                    ? "bg-amber-500"
                    : "bg-sky-500",
            ].join(" ")}
          >
            {toast.type === "success"
              ? "✓"
              : toast.type === "error"
                ? "!"
                : toast.type === "warning"
                  ? "!"
                  : "i"}
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-black text-slate-900">
              {toast.title}
            </div>

            {toast.message && (
              <div className="mt-1 text-xs font-semibold leading-relaxed text-slate-500">
                {toast.message}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setToast(null)}
            className="pointer-events-auto rounded-lg px-2 text-lg font-black text-slate-300 hover:bg-slate-50 hover:text-slate-600"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}