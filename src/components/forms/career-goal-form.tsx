"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMasterOptions } from "@/components/forms/use-master-options";

const careerGoalFallback = {
  mobility_preference: [
    { value: "", label: "未設定" },
    { value: "ok", label: "可" },
    { value: "conditional", label: "条件付き可" },
    { value: "ng", label: "不可" },
  ],
};

export function CareerGoalForm({
  employeeId,
  canEdit,
  initialData,
}: {
  employeeId: string;
  canEdit: boolean;
  initialData: {
    goal1y: string;
    goal3y: string;
    desiredRole: string;
    desiredCareerPath: string;
    reskillingInterest: string;
    mobilityPreference: string;
    selfComment: string;
  };
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [form, setForm] = useState(initialData);
  const optionsByCategory = useMasterOptions(["mobility_preference"], careerGoalFallback);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/employees/${employeeId}/career-goals`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message ?? "保存に失敗しました");
      }

      router.refresh();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl">
      {errorMsg && (
        <div className="p-3 border rounded bg-red-50 text-sm">{errorMsg}</div>
      )}

      <Field label="1年後の目標">
        <textarea
          className="border rounded p-2 w-full min-h-20"
          value={form.goal1y}
          onChange={(e) => setForm((v) => ({ ...v, goal1y: e.target.value }))}
          disabled={!canEdit}
        />
      </Field>

      <Field label="3年後の目標">
        <textarea
          className="border rounded p-2 w-full min-h-20"
          value={form.goal3y}
          onChange={(e) => setForm((v) => ({ ...v, goal3y: e.target.value }))}
          disabled={!canEdit}
        />
      </Field>

      <Field label="希望役割">
        <input
          className="border rounded p-2 w-full"
          value={form.desiredRole}
          onChange={(e) => setForm((v) => ({ ...v, desiredRole: e.target.value }))}
          disabled={!canEdit}
        />
      </Field>

      <Field label="希望キャリアパス">
        <textarea
          className="border rounded p-2 w-full min-h-20"
          value={form.desiredCareerPath}
          onChange={(e) => setForm((v) => ({ ...v, desiredCareerPath: e.target.value }))}
          disabled={!canEdit}
        />
      </Field>

      <Field label="リスキリング希望">
        <textarea
          className="border rounded p-2 w-full min-h-20"
          value={form.reskillingInterest}
          onChange={(e) => setForm((v) => ({ ...v, reskillingInterest: e.target.value }))}
          disabled={!canEdit}
        />
      </Field>

      <Field label="異動希望">
        <select
          className="border rounded p-2 w-full"
          value={form.mobilityPreference}
          onChange={(e) => setForm((v) => ({ ...v, mobilityPreference: e.target.value }))}
          disabled={!canEdit}
        >
          {optionsByCategory.mobility_preference.map((item) => (
            <option key={item.value || "none"} value={item.value}>{item.label}</option>
          ))}
        </select>
      </Field>

      <Field label="本人コメント">
        <textarea
          className="border rounded p-2 w-full min-h-24"
          value={form.selfComment}
          onChange={(e) => setForm((v) => ({ ...v, selfComment: e.target.value }))}
          disabled={!canEdit}
        />
      </Field>

      {canEdit && (
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded border bg-black text-white disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存する"}
        </button>
      )}
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="text-sm font-medium">{label}</div>
      {children}
    </div>
  );
}