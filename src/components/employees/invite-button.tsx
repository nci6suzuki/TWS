"use client";

import { useState } from "react";

export function InviteButton({ employeeId, disabled }: { employeeId: string; disabled?: boolean }) {
  const [loading, setLoading] = useState(false);

  async function onInvite() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/invite-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        alert(json?.error?.message ?? "招待に失敗しました");
        return;
      }
      alert("招待メールを送信しました");
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
        "inline-flex h-8 items-center rounded-lg px-3 text-xs font-semibold text-white",
        disabled ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:bg-slate-800",
      ].join(" ")}
    >
      {loading ? "送信中..." : "招待"}
    </button>
  );
}