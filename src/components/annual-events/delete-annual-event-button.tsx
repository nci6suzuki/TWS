"use client";

import { useState } from "react";

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
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    const ok = confirm(
      "この年間イベントを削除します。\n削除すると元に戻せません。よろしいですか？"
    );

    if (!ok) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("returnTo", returnTo);

      const res = await fetch(`/api/annual-events/${eventId}/delete`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok && !res.redirected) {
        const text = await res.text();
        alert(text || "削除に失敗しました");
        return;
      }

      if (res.redirected) {
        window.location.href = res.url;
        return;
      }

      window.location.href = returnTo;
    } catch (e: any) {
      alert(e?.message ?? "削除に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  const sizeClass =
    size === "md"
      ? "h-9 rounded-xl px-4 text-sm"
      : "h-8 rounded-lg px-3 text-xs";

  return (
    <button
      type="button"
      disabled={loading}
      onClick={onDelete}
      className={[
        "inline-flex items-center font-black text-white transition",
        sizeClass,
        loading
          ? "cursor-not-allowed bg-slate-400"
          : "bg-rose-600 hover:bg-rose-700",
      ].join(" ")}
    >
      {loading ? "削除中..." : label}
    </button>
  );
}