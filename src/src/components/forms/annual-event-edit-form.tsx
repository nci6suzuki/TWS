// src/components/forms/annual-event-edit-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EmployeePicker } from "@/components/pickers/employee-picker";
import { Me } from "@/types/api";

export function AnnualEventEditForm({
  me,
  initialData,
}: {
  me: Me;
  initialData: {
    id: string;
    employeeId: string;
    title: string;
    eventType: string;
    scheduledDate: string;
    status: string;
    priority: number;
    ownerEmployeeId: string;
    description: string;
  };
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    employeeId: initialData.employeeId,
    title: initialData.title,
    eventType: initialData.eventType,
    scheduledDate: initialData.scheduledDate,
    ownerEmployeeId: initialData.ownerEmployeeId,
    priority: initialData.priority,
    status: initialData.status,
    description: initialData.description,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/annual-events/${initialData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message ?? "保存に失敗しました");
      }

      router.push(`/annual-events/${initialData.id}`);
      router.refresh();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && <div className="p-3 border rounded bg-red-50 text-sm">{errorMsg}</div>}

      <EmployeePicker
        label="対象社員"
        value={form.employeeId}
        onChange={(value) => setForm((v) => ({ ...v, employeeId: value }))}
      />

      <Field label="タイトル">
        <input
          className="border rounded p-2 w-full"
          value={form.title}
          onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))}
        />
      </Field>

      <Field label="種別">
        <select
          className="border rounded p-2 w-full"
          value={form.eventType}
          onChange={(e) => setForm((v) => ({ ...v, eventType: e.target.value }))}
        >
          <option value="interview">面談</option>
          <option value="training">研修</option>
          <option value="evaluation">評価</option>
          <option value="other">その他</option>
        </select>
      </Field>

      <Field label="予定日">
        <input
          type="date"
          className="border rounded p-2 w-full"
          value={form.scheduledDate}
          onChange={(e) => setForm((v) => ({ ...v, scheduledDate: e.target.value }))}
        />
      </Field>

      <EmployeePicker
        label="担当者"
        value={form.ownerEmployeeId}
        onChange={(value) => setForm((v) => ({ ...v, ownerEmployeeId: value }))}
      />

      <Field label="優先度">
        <select
          className="border rounded p-2 w-full"
          value={form.priority}
          onChange={(e) => setForm((v) => ({ ...v, priority: Number(e.target.value) }))}
        >
          <option value={1}>高</option>
          <option value={2}>中</option>
          <option value={3}>低</option>
        </select>
      </Field>

      <Field label="状態">
        <select
          className="border rounded p-2 w-full"
          value={form.status}
          onChange={(e) => setForm((v) => ({ ...v, status: e.target.value }))}
        >
          <option value="pending">未実施</option>
          <option value="done">完了</option>
          <option value="cancelled">中止</option>
        </select>
      </Field>

      <Field label="説明">
        <textarea
          className="border rounded p-2 w-full min-h-24"
          value={form.description}
          onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))}
        />
      </Field>

      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="px-4 py-2 rounded border bg-black text-white disabled:opacity-50">
          {saving ? "保存中..." : "保存する"}
        </button>
        <button type="button" className="px-4 py-2 rounded border" onClick={() => router.back()}>
          戻る
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-sm font-medium">{label}</div>
      {children}
    </div>
  );
}