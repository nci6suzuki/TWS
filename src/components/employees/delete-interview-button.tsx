// src/components/employees/delete-interview-button.tsx

"use client";

import { useState } from "react";

export function DeleteInterviewButton({
  employeeCode,
  interviewId,
  returnTo,
  label = "削除",
}: {
  employeeCode: string;
  interviewId: string;
  returnTo?: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    const ok = confirm(
      "この面談履歴を削除します。\n関連する年間イベントも削除されます。\nよろしいですか？"
    );

    if (!ok) return;

    setLoading(true);

    try {
      const safeReturnTo =
        returnTo ?? `/employees/code/${employeeCode}/interviews`;

      const formData = new FormData();
      formData.append("employeeCode", employeeCode);
      formData.append("returnTo", safeReturnTo);

      const res = await fetch(`/api/employee-interviews/${interviewId}/delete`, {
        method: "POST",
        body: formData,
      });

      if (res.redirected) {
        window.location.href = res.url;
        return;
      }

      if (!res.ok) {
        const text = await res.text();
        alert(text || "面談履歴の削除に失敗しました");
        return;
      }

      window.location.href = safeReturnTo;
    } catch (e: any) {
      alert(e?.message ?? "面談履歴の削除に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={onDelete}
      className={[
        "inline-flex h-8 items-center rounded-lg px-3 text-xs font-black text-white transition",
        loading
          ? "cursor-not-allowed bg-slate-400"
          : "bg-rose-600 hover:bg-rose-700",
      ].join(" ")}
    >
      {loading ? "削除中..." : label}
    </button>
  );
}