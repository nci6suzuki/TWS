// src/components/forms/qualification-edit-form.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMasterOptions } from "@/components/forms/use-master-options";

const qualificationStatusFallback = {
  qualification_status: [
    { value: "valid", label: "有効" },
    { value: "expired", label: "失効" },
    { value: "planned", label: "取得予定" },
  ],
};

type QualificationOption = {
  id: string;
  name: string;
};

export function QualificationEditForm({
  qualificationRecordId,
  initialData,
}: {
  qualificationRecordId: string;
  initialData: {
    qualificationId: string;
    acquiredDate: string;
    expiresOn: string;
    status: string;
    memo: string;
  };
}) {
  const router = useRouter();
  const [items, setItems] = useState<QualificationOption[]>([]);
  const [saving, setSaving] = useState(false);
  const optionsByCategory = useMasterOptions(["qualification_status"], qualificationStatusFallback);
  const [form, setForm] = useState(initialData);

  useEffect(() => {
    fetch("/api/masters/qualifications")
      .then((res) => res.json())
      .then((json) => setItems(json?.data?.items ?? []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/employee-qualifications/${qualificationRecordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error("保存に失敗しました");

      router.refresh();
    } catch {
      alert("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("この資格を削除しますか？")) return;

    try {
      const res = await fetch(`/api/employee-qualifications/${qualificationRecordId}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error("削除に失敗しました");

      router.refresh();
    } catch {
      alert("削除に失敗しました");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border rounded p-4">
      <div className="font-medium">資格編集</div>

      <select
        className="border rounded p-2 w-full"
        value={form.qualificationId}
        onChange={(e) => setForm((v) => ({ ...v, qualificationId: e.target.value }))}
      >
        <option value="">資格を選択</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>

      <input
        type="date"
        className="border rounded p-2 w-full"
        value={form.acquiredDate}
        onChange={(e) => setForm((v) => ({ ...v, acquiredDate: e.target.value }))}
      />

      <input
        type="date"
        className="border rounded p-2 w-full"
        value={form.expiresOn}
        onChange={(e) => setForm((v) => ({ ...v, expiresOn: e.target.value }))}
      />

      <select
        className="border rounded p-2 w-full"
        value={form.status}
        onChange={(e) => setForm((v) => ({ ...v, status: e.target.value }))}
      >
        {optionsByCategory.qualification_status.map((item) => (
          <option key={item.value} value={item.value}>{item.label}</option>
        ))}
      </select>

      <textarea
        className="border rounded p-2 w-full min-h-20"
        value={form.memo}
        onChange={(e) => setForm((v) => ({ ...v, memo: e.target.value }))}
      />

      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="px-4 py-2 rounded border bg-black text-white disabled:opacity-50">
          {saving ? "保存中..." : "保存する"}
        </button>
        <button type="button" onClick={handleDelete} className="px-4 py-2 rounded border text-red-600">
          削除
        </button>
      </div>
    </form>
  );
}