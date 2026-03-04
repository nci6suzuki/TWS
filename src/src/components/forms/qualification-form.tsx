// src/components/forms/qualification-form.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type QualificationOption = {
  id: string;
  name: string;
};

export function QualificationForm({ employeeId }: { employeeId: string }) {
  const router = useRouter();
  const [items, setItems] = useState<QualificationOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    qualificationId: "",
    acquiredDate: "",
    expiresOn: "",
    status: "valid",
    memo: "",
  });

  useEffect(() => {
    fetch("/api/masters/qualifications")
      .then((res) => res.json())
      .then((json) => setItems(json?.data?.items ?? []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/employees/${employeeId}/qualifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error("保存に失敗しました");

      setForm({
        qualificationId: "",
        acquiredDate: "",
        expiresOn: "",
        status: "valid",
        memo: "",
      });

      router.refresh();
    } catch {
      alert("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border rounded p-4">
      <div className="font-medium">資格追加</div>

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
        <option value="valid">有効</option>
        <option value="expired">失効</option>
        <option value="planned">取得予定</option>
      </select>

      <textarea
        className="border rounded p-2 w-full min-h-20"
        placeholder="メモ"
        value={form.memo}
        onChange={(e) => setForm((v) => ({ ...v, memo: e.target.value }))}
      />

      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 rounded border bg-black text-white disabled:opacity-50"
      >
        {saving ? "保存中..." : "追加する"}
      </button>
    </form>
  );
}