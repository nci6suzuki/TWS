// src/components/annual-events/complete-annual-event-button.tsx

"use client";

import { CompleteActionButton } from "@/components/ui/complete-action-button";

export function CompleteAnnualEventButton({
  eventId,
  returnTo = "/annual-events",
  label = "完了化",
  size = "sm",
}: {
  eventId: string;
  returnTo?: string;
  label?: string;
  size?: "sm" | "md";
}) {
  const sizeClass =
    size === "md"
      ? "inline-flex h-9 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-black text-white hover:bg-emerald-700"
      : "inline-flex h-8 items-center justify-center rounded-lg bg-emerald-600 px-3 text-xs font-black text-white hover:bg-emerald-700";

  return (
    <CompleteActionButton
      className={sizeClass}
      pendingText="完了処理中..."
      confirmMessage={
        "この年間イベントを完了にします。\nよろしいですか？"
      }
      onComplete={async () => {
        const formData = new FormData();
        formData.append("returnTo", returnTo);

        const res = await fetch(`/api/annual-events/${eventId}/complete`, {
          method: "POST",
          body: formData,
        });

        if (res.redirected) {
          window.location.href = res.url;
          return;
        }

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "年間イベントの完了処理に失敗しました");
        }

        const separator = returnTo.includes("?") ? "&" : "?";
        window.location.href = `${returnTo}${separator}completed=年間イベント`;
      }}
    >
      {label}
    </CompleteActionButton>
  );
}