"use client";

import { useState } from "react";

export function InviteEmployeeButton({
  employeeId,
  email,
  hasUserId,
}: {
  employeeId: string;
  email: string;
  hasUserId: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function handleInvite() {
    if (!email) {
      alert("メールアドレスが未設定です。");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/invite-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          email,
          redirectTo: `${window.location.origin}/auth/callback`,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message ?? "招待に失敗しました");
      }

      alert(hasUserId ? "再招待メールを送信しました" : "招待メールを送信しました");
      window.location.reload();
    } catch (e: any) {
      alert(e?.message ?? "招待に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleInvite}
      disabled={loading}
      className="px-3 py-2 rounded border text-sm"
    >
      {loading ? "送信中..." : hasUserId ? "再招待" : "招待送信"}
    </button>
  );
}