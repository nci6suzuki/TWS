// src/components/employees/invite-button.tsx

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
    const message = force
      ? "再招待メールを送信します。よろしいですか？"
      : "この社員に招待メールを送信します。よろしいですか？";

    if (!confirm(message)) return;

    setLoading(true);

    try {
      const res = await fetch("/api/admin/invite-employee", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ employeeId, force }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        alert(json?.error?.message ?? json?.message ?? "招待に失敗しました");
        return;
      }

      alert(
        force
          ? "再招待メールを送信しました。タイムラインにも履歴を保存しました。"
          : "招待メールを送信しました。タイムラインにも履歴を保存しました。"
      );

      location.reload();
    } catch (e: any) {
      alert(e?.message ?? "招待に失敗しました");
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
        "inline-flex h-8 items-center rounded-lg px-3 text-xs font-black text-white transition",
        disabled || loading
          ? "cursor-not-allowed bg-slate-400"
          : "bg-slate-900 hover:bg-slate-800",
      ].join(" ")}
    >
      {loading ? "送信中..." : label ?? (force ? "再招待" : "招待")}
    </button>
  );
}