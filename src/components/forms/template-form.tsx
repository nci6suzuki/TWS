"use client";

import { CSSProperties, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardText, CardTitle } from "@/components/ui/card";
import { useMasterOptions } from "@/components/forms/use-master-options";

const templateOptionFallback = {
  annual_event_type: [
    { value: "interview", label: "面談" },
    { value: "training", label: "研修" },
    { value: "evaluation", label: "評価" },
    { value: "other", label: "その他" },
  ],
  default_owner_type: [
    { value: "manager", label: "上長" },
    { value: "mentor", label: "メンター" },
    { value: "hr", label: "人事" },
  ],
  priority_level: [
    { value: "1", label: "高" },
    { value: "2", label: "中" },
    { value: "3", label: "低" },
  ],
};

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

  const optionsByCategory = useMasterOptions(["annual_event_type", "default_owner_type", "priority_level"], templateOptionFallback);

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
    <form onSubmit={handleSubmit} style={{ width: "100%", display: "grid", gap: 18 }}>
      {errorMsg && <div style={errorStyle}>{errorMsg}</div>}

      <Card variant="elevated" style={{ padding: 0, overflow: "hidden" }}>
        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <CardTitle style={{ fontSize: 22 }}>🧩 テンプレート基本情報</CardTitle>
            <CardText style={{ marginTop: 8, fontSize: 14 }}>
              対象社員条件とテンプレートの公開状態を設定します。
            </CardText>
          </div>

          <div style={twoColumnGridStyle}>
            <Field label="テンプレート名" required wide>
              <input style={controlStyle} value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} />
            </Field>

            <Field label="対象職種">
              <input style={controlStyle} value={form.targetJobType} onChange={(e) => setForm((v) => ({ ...v, targetJobType: e.target.value }))} placeholder="例：新卒営業 / 中途営業" />
            </Field>

            <Field label="対象等級">
              <input style={controlStyle} value={form.targetGrade} onChange={(e) => setForm((v) => ({ ...v, targetGrade: e.target.value }))} placeholder="例：一般 / 主任" />
            </Field>

            <label style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
              <span style={fieldLabelStyle}>状態</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, color: "#0f172a" }}>
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((v) => ({ ...v, isActive: e.target.checked }))} />
                有効にする
              </span>
            </label>
          </div>
        </section>
      </Card>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <section style={{ ...sectionStyle, background: "#ffffff" }}>
          <div style={sectionHeaderStyle}>
            <CardTitle style={{ fontSize: 22 }}>🗓️ イベント定義</CardTitle>
            <CardText style={{ marginTop: 8, fontSize: 14 }}>
              面談・研修などのイベント内容、タイミング、担当者ルールを設定します。
            </CardText>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            {form.events.map((event, index) => (
              <div key={index} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 14, display: "grid", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>イベント {index + 1}</div>
                  {form.events.length > 1 && (
                    <button type="button" onClick={() => removeEvent(index)} style={{ border: "none", background: "transparent", color: "#dc2626", fontSize: 13, textDecoration: "underline", cursor: "pointer" }}>
                      削除
                    </button>
                  )}
                </div>

                <div style={twoColumnGridStyle}>
                  <Field label="種別" required>
                    <select style={controlStyle} value={event.eventType} onChange={(e) => updateEvent(index, { eventType: e.target.value })}>
                      {optionsByCategory.annual_event_type.map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="タイトル" required>
                    <input style={controlStyle} value={event.title} onChange={(e) => updateEvent(index, { title: e.target.value })} />
                  </Field>

                  <Field label="入社日から何日後" required>
                    <input type="number" style={controlStyle} value={event.offsetDaysFromHire} onChange={(e) => updateEvent(index, { offsetDaysFromHire: Number(e.target.value) })} />
                  </Field>

                  <Field label="担当者種別" required>
                    <select style={controlStyle} value={event.defaultOwnerType} onChange={(e) => updateEvent(index, { defaultOwnerType: e.target.value })}>
                      {optionsByCategory.default_owner_type.map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="優先度" required>
                    <select style={controlStyle} value={event.priority} onChange={(e) => updateEvent(index, { priority: Number(e.target.value) })}>
                      {optionsByCategory.priority_level.map((item) => (
                        <option key={item.value} value={Number(item.value)}>{item.label}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="説明" wide>
                    <textarea style={textareaStyle} value={event.description} onChange={(e) => updateEvent(index, { description: e.target.value })} />
                  </Field>
                </div>
              </div>
            ))}

            <button type="button" onClick={addEvent} style={secondaryButtonStyle}>
              イベントを追加
            </button>
          </div>
        </section>
      </Card>

      <div style={actionBarStyle}>
        <button type="submit" disabled={saving} style={primaryButtonStyle}>
          {saving ? "保存中..." : "保存する"}
        </button>
        <button type="button" onClick={() => router.back()} style={secondaryButtonStyle}>
          戻る
        </button>
      </div>
    </form>
  );
}

function Field({ label, required, children, wide }: { label: string; required?: boolean; children: React.ReactNode; wide?: boolean }) {
  return (
    <label style={{ ...fieldStyle, ...(wide ? { gridColumn: "1 / -1" } : null) }}>
      <span style={fieldLabelStyle}>
        {label}
        {required ? <span style={{ color: "#e11d48", marginLeft: 4 }}>*</span> : null}
      </span>
      {children}
    </label>
  );
}

const sectionStyle: CSSProperties = { padding: 26, background: "#f8fafc" };
const sectionHeaderStyle: CSSProperties = { borderBottom: "1px solid #e2e8f0", paddingBottom: 14, marginBottom: 16 };
const twoColumnGridStyle: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 };
const fieldStyle: CSSProperties = { display: "grid", gap: 6, minWidth: 0 };
const fieldLabelStyle: CSSProperties = { fontSize: 13, fontWeight: 700, color: "#1f2937" };
const controlStyle: CSSProperties = { height: 40, border: "1px solid #cbd5e1", borderRadius: 10, padding: "0 12px", fontSize: 14, background: "#fff" };
const textareaStyle: CSSProperties = { ...controlStyle, height: "auto", minHeight: 100, padding: "10px 12px", resize: "vertical" };
const errorStyle: CSSProperties = { borderRadius: 12, border: "1px solid #fecaca", background: "#fef2f2", padding: "10px 12px", color: "#b91c1c", fontSize: 14 };
const actionBarStyle: CSSProperties = { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" };
const primaryButtonStyle: CSSProperties = { border: "none", borderRadius: 10, background: "#0f172a", color: "#fff", height: 40, padding: "0 18px", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: 1 };
const secondaryButtonStyle: CSSProperties = { border: "1px solid #cbd5e1", borderRadius: 10, background: "#fff", color: "#0f172a", height: 40, padding: "0 16px", fontSize: 14, fontWeight: 600, cursor: "pointer" };