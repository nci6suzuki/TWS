"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TemplateEventForm = {
  id?: string;
  eventType: string;
  title: string;
  offsetDaysFromHire: number;
  defaultOwnerType: string;
  priority: number;
  description: string;
};

type TemplateFormData = {
  id?: string;
  name: string;
  targetJobType: string;
  targetGrade: string;
  isActive: boolean;
  events: TemplateEventForm[];
};

export function TemplateForm({
  mode,
  initialData,
}: {
  mode: "create" | "edit";
  initialData?: TemplateFormData;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateFormData>({
    id: initialData?.id,
    name: initialData?.name ?? "",
    targetJobType: initialData?.targetJobType ?? "",
    targetGrade: initialData?.targetGrade ?? "",
    isActive: initialData?.isActive ?? true,
    events: initialData?.events ?? [
      {
        eventType: "interview",
        title: "",
        offsetDaysFromHire: 0,
        defaultOwnerType: "manager",
        priority: 2,
        description: "",
      },
    ],
  });

  function updateEvent(index: number, patch: Partial<TemplateEventForm>) {
    setForm((prev) => ({
      ...prev,
      events: prev.events.map((event, i) =>
        i === index ? { ...event, ...patch } : event
      ),
    }));
  }

  function addEvent() {
    setForm((prev) => ({
      ...prev,
      events: [
        ...prev.events,
        {
          eventType: "interview",
          title: "",
          offsetDaysFromHire: 0,
          defaultOwnerType: "manager",
          priority: 2,
          description: "",
        },
      ],
    }));
  }

  function removeEvent(index: number) {
    setForm((prev) => ({
      ...prev,
      events: prev.events.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    try {
      const url =
        mode === "create"
          ? "/api/templates"
          : `/api/templates/${initialData?.id}`;

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

      router.push("/settings/templates");
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

      <Field label="テンプレート名">
        <input
          className="border rounded p-2 w-full"
          value={form.name}
          onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))}
        />
      </Field>

      <Field label="対象職種">
        <input
          className="border rounded p-2 w-full"
          value={form.targetJobType}
          onChange={(e) => setForm((v) => ({ ...v, targetJobType: e.target.value }))}
          placeholder="例：新卒営業 / 中途営業"
        />
      </Field>

      <Field label="対象等級">
        <input
          className="border rounded p-2 w-full"
          value={form.targetGrade}
          onChange={(e) => setForm((v) => ({ ...v, targetGrade: e.target.value }))}
          placeholder="例：一般 / 主任"
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => setForm((v) => ({ ...v, isActive: e.target.checked }))}
        />
        有効にする
      </label>

      <div className="space-y-3">
        <div className="font-medium">イベント定義</div>

        {form.events.map((event, index) => (
          <div key={index} className="border rounded p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-medium text-sm">イベント {index + 1}</div>
              {form.events.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEvent(index)}
                  className="text-sm text-red-600 underline"
                >
                  削除
                </button>
              )}
            </div>

            <Field label="種別">
              <select
                className="border rounded p-2 w-full"
                value={event.eventType}
                onChange={(e) => updateEvent(index, { eventType: e.target.value })}
              >
                <option value="interview">面談</option>
                <option value="training">研修</option>
                <option value="evaluation">評価</option>
                <option value="other">その他</option>
              </select>
            </Field>

            <Field label="タイトル">
              <input
                className="border rounded p-2 w-full"
                value={event.title}
                onChange={(e) => updateEvent(index, { title: e.target.value })}
              />
            </Field>

            <Field label="入社日から何日後">
              <input
                type="number"
                className="border rounded p-2 w-full"
                value={event.offsetDaysFromHire}
                onChange={(e) =>
                  updateEvent(index, { offsetDaysFromHire: Number(e.target.value) })
                }
              />
            </Field>

            <Field label="担当者種別">
              <select
                className="border rounded p-2 w-full"
                value={event.defaultOwnerType}
                onChange={(e) => updateEvent(index, { defaultOwnerType: e.target.value })}
              >
                <option value="manager">上長</option>
                <option value="mentor">メンター</option>
                <option value="hr">人事</option>
              </select>
            </Field>

            <Field label="優先度">
              <select
                className="border rounded p-2 w-full"
                value={event.priority}
                onChange={(e) => updateEvent(index, { priority: Number(e.target.value) })}
              >
                <option value={1}>高</option>
                <option value={2}>中</option>
                <option value={3}>低</option>
              </select>
            </Field>

            <Field label="説明">
              <textarea
                className="border rounded p-2 w-full min-h-20"
                value={event.description}
                onChange={(e) => updateEvent(index, { description: e.target.value })}
              />
            </Field>
          </div>
        ))}

        <button
          type="button"
          onClick={addEvent}
          className="px-3 py-2 rounded border text-sm"
        >
          イベントを追加
        </button>
      </div>

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
          onClick={() => router.back()}
          className="px-4 py-2 rounded border"
        >
          戻る
        </button>
      </div>
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