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
      const formData = new FormData();

      if (returnTo) {
        formData.append("returnTo", returnTo);
      }

      const res = await fetch(
        `/employees/code/${employeeCode}/interviews/${interviewId}/delete`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok && !res.redirected) {
        const text = await res.text();
        alert(text || "面談履歴の削除に失敗しました");
        return;
      }

      if (res.redirected) {
        window.location.href = res.url;
        return;
      }

      window.location.href =
        returnTo ?? `/employees/code/${employeeCode}/interviews`;
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