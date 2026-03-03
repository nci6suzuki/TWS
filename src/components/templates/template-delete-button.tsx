// src/components/templates/template-delete-button.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TemplateDeleteButton({ templateId }: { templateId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("このテンプレートを削除しますか？")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/templates/${templateId}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message ?? "削除に失敗しました");
      }

      router.push("/settings/templates");
      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? "削除に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="px-4 py-2 rounded border text-red-600 text-sm disabled:opacity-50"
    >
      {loading ? "削除中..." : "削除"}
    </button>
  );
}