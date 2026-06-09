"use client";

import { useState } from "react";

export function InviteButton({
  employeeId,
  disabled,
  force = false,
  label,
}: {
  employeeId: string;
  disabled?: boolean;
  force?: boolean;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function onInvite() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/invite-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, force }),
      });

      const json = await res.json();
      if (!res.ok || !json?.success) {
        alert(json?.error?.message ?? "招待に失敗しました");
        return;
      }

      alert(force ? "再招待メールを送信しました" : "招待メールを送信しました");
      location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onInvite}
      className={[
        "inline-flex h-8 items-center rounded-lg px-3 text-xs font-black text-white",
        disabled || loading ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:bg-slate-800",
      ].join(" ")}
    >
      {loading ? "送信中..." : label ?? (force ? "再招待" : "招待")}
    </button>
  );
}