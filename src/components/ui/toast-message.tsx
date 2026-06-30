// src/components/ui/toast-message.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ToastType = "success" | "error" | "info" | "warning";

type ToastState = {
  type: ToastType;
  title: string;
  message?: string;
};

const TOAST_PARAM_KEYS = [
  "error",
  "created",
  "updated",
  "deleted",
  "assigned",
  "generated",
  "read",
  "completed",
  "sent",
  "invited",
] as const;

export function ToastMessage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [toast, setToast] = useState<ToastState | null>(null);
  const [handledKey, setHandledKey] = useState<string>("");

  const toastFromParams = useMemo(() => {
    const error = searchParams.get("error");
    const created = searchParams.get("created");
    const updated = searchParams.get("updated");
    const deleted = searchParams.get("deleted");
    const assigned = searchParams.get("assigned");
    const generated = searchParams.get("generated");
    const read = searchParams.get("read");
    const completed = searchParams.get("completed");
    const sent = searchParams.get("sent");
    const invited = searchParams.get("invited");

    if (error) {
      return {
        key: `error:${error}`,
        toast: {
          type: "error" as const,
          title: "エラーが発生しました",
          message: error,
        },
      };
    }

    if (created) {
      return {
        key: `created:${created}`,
        toast: {
          type: "success" as const,
          title: "追加しました",
          message: `「${created}」を追加しました。`,
        },
      };
    }

    if (updated) {
      return {
        key: `updated:${updated}`,
        toast: {
          type: "success" as const,
          title: "更新しました",
          message: `「${updated}」を更新しました。`,
        },
      };
    }

    if (deleted) {
      return {
        key: `deleted:${deleted}`,
        toast: {
          type: "warning" as const,
          title: "削除しました",
          message: `「${deleted}」を削除しました。`,
        },
      };
    }

    if (assigned) {
      return {
        key: `assigned:${assigned}`,
        toast: {
          type: "success" as const,
          title: "所属を更新しました",
          message: "社員の所属情報を更新しました。",
        },
      };
    }

    if (generated) {
      return {
        key: `generated:${generated}`,
        toast: {
          type: "success" as const,
          title: "通知を生成しました",
          message: `${generated}件の通知を生成しました。`,
        },
      };
    }

    if (read) {
      return {
        key: `read:${read}`,
        toast: {
          type: "success" as const,
          title: "既読にしました",
          message: "通知を既読にしました。",
        },
      };
    }

    if (completed) {
      return {
        key: `completed:${completed}`,
        toast: {
          type: "success" as const,
          title: "完了しました",
          message:
            completed === "1"
              ? "処理を完了しました。"
              : `「${completed}」を完了しました。`,
        },
      };
    }

    if (sent) {
      return {
        key: `sent:${sent}`,
        toast: {
          type: "success" as const,
          title: "送信しました",
          message:
            sent === "1"
              ? "送信が完了しました。"
              : `「${sent}」を送信しました。`,
        },
      };
    }

    if (invited) {
      return {
        key: `invited:${invited}`,
        toast: {
          type: "success" as const,
          title: "招待メールを送信しました",
          message:
            invited === "1"
              ? "招待メールを送信しました。"
              : `「${invited}」へ招待メールを送信しました。`,
        },
      };
    }

    return null;
  }, [searchParams]);

  useEffect(() => {
    if (!toastFromParams) return;
    if (handledKey === toastFromParams.key) return;

    setHandledKey(toastFromParams.key);
    setToast(toastFromParams.toast);

    const params = new URLSearchParams(searchParams.toString());

    TOAST_PARAM_KEYS.forEach((key) => {
      params.delete(key);
    });

    const nextUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;

    const cleanupTimer = setTimeout(() => {
      router.replace(nextUrl, { scroll: false });
    }, 250);

    return () => clearTimeout(cleanupTimer);
  }, [toastFromParams, handledKey, pathname, router, searchParams]);

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
            aria-label="通知を閉じる"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}