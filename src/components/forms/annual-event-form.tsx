// src/components/forms/annual-event-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EmployeePicker } from "@/components/pickers/employee-picker";
import { Me } from "@/types/api";
import { useMasterOptions } from "@/components/forms/use-master-options";

const annualEventOptionFallback = {
  annual_event_type: [
    { value: "interview", label: "面談" },
    { value: "training", label: "研修" },
    { value: "evaluation", label: "評価" },
    { value: "other", label: "その他" },
  ],
  priority_level: [
    { value: "1", label: "高" },
    { value: "2", label: "中" },
    { value: "3", label: "低" },
  ],
  annual_event_status: [
    { value: "pending", label: "未実施" },
    { value: "done", label: "完了" },
    { value: "cancelled", label: "中止" },
  ],
};

export function AnnualEventForm({ me }: { me: Me }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const optionsByCategory = useMasterOptions(["annual_event_type", "priority_level", "annual_event_status"], annualEventOptionFallback);
  const [form, setForm] = useState({
    employeeId: "",
    title: "",
    eventType: "interview",
    scheduledDate: "",
    ownerEmployeeId: me.employeeId,
    priority: 2,
    status: "pending",
    description: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/annual-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message ?? "保存に失敗しました");
      }

      router.push("/annual-events");
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
        <input className="border rounded p-2 w-full" value={form.title} onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))} />
      </Field>

      <Field label="種別">
        <select className="border rounded p-2 w-full" value={form.eventType} onChange={(e) => setForm((v) => ({ ...v, eventType: e.target.value }))}>
          {optionsByCategory.annual_event_type.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </Field>

      <Field label="予定日">
        <input type="date" className="border rounded p-2 w-full" value={form.scheduledDate} onChange={(e) => setForm((v) => ({ ...v, scheduledDate: e.target.value }))} />
      </Field>

      <EmployeePicker
        label="担当者"
        value={form.ownerEmployeeId}
        onChange={(value) => setForm((v) => ({ ...v, ownerEmployeeId: value }))}
      />

      <Field label="優先度">
        <select className="border rounded p-2 w-full" value={form.priority} onChange={(e) => setForm((v) => ({ ...v, priority: Number(e.target.value) }))}>
          {optionsByCategory.priority_level.map((item) => (
            <option key={item.value} value={Number(item.value)}>{item.label}</option>
          ))}
        </select>
      </Field>

      <Field label="状態">
        <select className="border rounded p-2 w-full" value={form.status} onChange={(e) => setForm((v) => ({ ...v, status: e.target.value }))}>
          {optionsByCategory.annual_event_status.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </Field>

      <Field label="説明">
        <textarea className="border rounded p-2 w-full min-h-24" value={form.description} onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))} />
      </Field>

      <button type="submit" disabled={saving} className="px-4 py-2 rounded border bg-black text-white disabled:opacity-50">
        {saving ? "保存中..." : "保存する"}
      </button>
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