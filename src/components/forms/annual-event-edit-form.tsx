// src/components/forms/annual-event-edit-form.tsx
"use client";

import { CSSProperties, useState } from "react";
import { useRouter } from "next/navigation";
import { EmployeePicker } from "@/components/pickers/employee-picker";
import { Card, CardText, CardTitle } from "@/components/ui/card";
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
    <form onSubmit={handleSubmit} style={{ width: "100%", display: "grid", gap: 18 }}>
      {errorMsg && <div style={errorStyle}>{errorMsg}</div>}

      <Card variant="elevated" style={{ padding: 0, overflow: "hidden" }}>
        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <CardTitle style={{ fontSize: 22 }}>📅 イベント情報</CardTitle>
            <CardText style={{ marginTop: 8, fontSize: 14 }}>
              年間イベントの基本情報と担当・優先度を設定します。
            </CardText>
          </div>

          <div style={twoColumnGridStyle}>
            <Field label="対象社員" required>
              <div style={{ minWidth: 0 }}>
                <EmployeePicker
                  label=""
                  value={form.employeeId}
                  onChange={(value) => setForm((v) => ({ ...v, employeeId: value }))}
                />
              </div>
            </Field>

            <Field label="担当者" required>
              <div style={{ minWidth: 0 }}>
                <EmployeePicker
                  label=""
                  value={form.ownerEmployeeId}
                  onChange={(value) => setForm((v) => ({ ...v, ownerEmployeeId: value }))}
                />
              </div>
            </Field>

            <Field label="タイトル" required wide>
              <input style={controlStyle} value={form.title} onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))} />
            </Field>

            <Field label="種別" required>
              <select style={controlStyle} value={form.eventType} onChange={(e) => setForm((v) => ({ ...v, eventType: e.target.value }))}>
                <option value="interview">面談</option>
                <option value="training">研修</option>
                <option value="evaluation">評価</option>
                <option value="other">その他</option>
              </select>
            </Field>

            <Field label="予定日" required>
              <input type="date" style={controlStyle} value={form.scheduledDate} onChange={(e) => setForm((v) => ({ ...v, scheduledDate: e.target.value }))} />
            </Field>

            <Field label="優先度" required>
              <select style={controlStyle} value={form.priority} onChange={(e) => setForm((v) => ({ ...v, priority: Number(e.target.value) }))}>
                <option value={1}>高</option>
                <option value={2}>中</option>
                <option value={3}>低</option>
              </select>
            </Field>

            <Field label="状態" required>
              <select style={controlStyle} value={form.status} onChange={(e) => setForm((v) => ({ ...v, status: e.target.value }))}>
                <option value="pending">未実施</option>
                <option value="done">完了</option>
                <option value="cancelled">中止</option>
              </select>
            </Field>

            <Field label="説明" wide>
              <textarea style={textareaStyle} value={form.description} onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))} />
            </Field>
          </div>
        </section>
      </Card>

      <div style={actionBarStyle}>
        <button type="submit" disabled={saving} style={primaryButtonStyle}>
          {saving ? "保存中..." : "保存する"}
        </button>
        <button type="button" style={secondaryButtonStyle} onClick={() => router.back()}>
          戻る
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
  wide,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  wide?: boolean;
}) {
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
const textareaStyle: CSSProperties = { ...controlStyle, height: "auto", minHeight: 120, padding: "10px 12px", resize: "vertical" };
const errorStyle: CSSProperties = { borderRadius: 12, border: "1px solid #fecaca", background: "#fef2f2", padding: "10px 12px", color: "#b91c1c", fontSize: 14 };
const actionBarStyle: CSSProperties = { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" };
const primaryButtonStyle: CSSProperties = { border: "none", borderRadius: 10, background: "#0f172a", color: "#fff", height: 40, padding: "0 18px", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: 1 };
const secondaryButtonStyle: CSSProperties = { border: "1px solid #cbd5e1", borderRadius: 10, background: "#fff", color: "#0f172a", height: 40, padding: "0 16px", fontSize: 14, fontWeight: 600, cursor: "pointer" };