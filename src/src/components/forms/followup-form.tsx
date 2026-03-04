// src/components/forms/followup-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FollowupDetail, Me } from "@/types/api";

export function FollowupForm({
  mode,
  me,
  initialData,
}: {
  mode: "create" | "edit";
  me: Me;
  initialData?: FollowupDetail;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    fiscalYear: initialData?.fiscalYear ?? new Date().getFullYear(),
    quarter: initialData?.quarter ?? 1,
    employeeId: initialData?.employeeId ?? "",
    followupType: initialData?.followupType ?? "retention",
    assigneeEmployeeId: initialData?.assigneeEmployeeId ?? me.employeeId,
    dueDate: initialData?.dueDate ?? "",
    priority: initialData?.priority ?? 2,
    note: initialData?.note ?? "",
    status: initialData?.status ?? "pending",
  });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    try {
      const url =
        mode === "create"
          ? "/api/followups"
          : `/api/followups/${initialData?.id}`;

      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message ?? "保存に失敗しました");
      }

      const id = mode === "create" ? json.data.id : initialData?.id;
      router.push(`/followups/${id}`);
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

      <Field label="年度">
        <input
          type="number"
          className="border rounded p-2 w-full"
          value={form.fiscalYear}
          onChange={(e) => setForm((v) => ({ ...v, fiscalYear: Number(e.target.value) }))}
        />
      </Field>

      <Field label="四半期">
        <select
          className="border rounded p-2 w-full"
          value={form.quarter}
          onChange={(e) => setForm((v) => ({ ...v, quarter: Number(e.target.value) }))}
        >
          <option value={1}>Q1</option>
          <option value={2}>Q2</option>
          <option value={3}>Q3</option>
          <option value={4}>Q4</option>
        </select>
      </Field>

      <Field label="対象社員ID（仮）">
        <input
          className="border rounded p-2 w-full"
          value={form.employeeId}
          onChange={(e) => setForm((v) => ({ ...v, employeeId: e.target.value }))}
        />
      </Field>

      <Field label="面談種別">
        <select
          className="border rounded p-2 w-full"
          value={form.followupType}
          onChange={(e) => setForm((v) => ({ ...v, followupType: e.target.value }))}
        >
          <option value="retention">定着</option>
          <option value="career">キャリア</option>
          <option value="performance">成果/業務</option>
          <option value="care">ケア</option>
        </select>
      </Field>

      <Field label="担当者ID（仮）">
        <input
          className="border rounded p-2 w-full"
          value={form.assigneeEmployeeId}
          onChange={(e) => setForm((v) => ({ ...v, assigneeEmployeeId: e.target.value }))}
        />
      </Field>

      <Field label="期限">
        <input
          type="date"
          className="border rounded p-2 w-full"
          value={form.dueDate}
          onChange={(e) => setForm((v) => ({ ...v, dueDate: e.target.value }))}
        />
      </Field>

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
          <option value="pending">未着手</option>
          <option value="in_progress">進行中</option>
          <option value="done">完了</option>
          <option value="overdue">期限超過</option>
        </select>
      </Field>

      <Field label="備考">
        <textarea
          className="border rounded p-2 w-full min-h-24"
          value={form.note}
          onChange={(e) => setForm((v) => ({ ...v, note: e.target.value }))}
        />
      </Field>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded border bg-black text-white disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存する"}
        </button>
        <button
          type="button"
          className="px-4 py-2 rounded border"
          onClick={() => router.back()}
        >
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