// src/components/annual-events/delete-annual-event-button.tsx

"use client";

import { DeleteActionButton } from "@/components/ui/delete-action-button";

export function DeleteAnnualEventButton({
  eventId,
  returnTo = "/annual-events",
  label = "削除",
  size = "sm",
}: {
  eventId: string;
  returnTo?: string;
  label?: string;
  size?: "sm" | "md";
}) {
  const sizeClass =
    size === "md"
      ? "inline-flex h-9 items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-black text-white hover:bg-rose-700"
      : "inline-flex h-8 items-center justify-center rounded-lg bg-rose-600 px-3 text-xs font-black text-white hover:bg-rose-700";

  return (
    <DeleteActionButton
      className={sizeClass}
      pendingText="削除中..."
      confirmMessage={
        "この年間イベントを削除します。\n削除すると元に戻せません。よろしいですか？"
      }
      onDelete={async () => {
        const formData = new FormData();
        formData.append("returnTo", returnTo);

        const res = await fetch(`/api/annual-events/${eventId}/delete`, {
          method: "POST",
          body: formData,
        });

        if (res.redirected) {
          window.location.href = res.url;
          return;
        }

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "年間イベントの削除に失敗しました");
        }

        const separator = returnTo.includes("?") ? "&" : "?";
        window.location.href = `${returnTo}${separator}deleted=年間イベント`;
      }}
    >
      {label}
    </DeleteActionButton>
  );
}