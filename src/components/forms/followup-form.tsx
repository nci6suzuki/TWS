// src/components/forms/followup-form.tsx
"use client";

import { CSSProperties, useState } from "react";
import { useRouter } from "next/navigation";
import type { FollowupDetail, FollowupStatus, Me } from "@/types/api";
import { Card, CardText, CardTitle } from "@/components/ui/card";
import { EmployeePicker } from "@/components/pickers/employee-picker";
import { useMasterOptions } from "@/components/forms/use-master-options";

const followupOptionFallback = {
  fiscal_quarter: [
    { value: "1", label: "Q1" },
    { value: "2", label: "Q2" },
    { value: "3", label: "Q3" },
    { value: "4", label: "Q4" },
  ],
  followup_type: [
    { value: "retention", label: "定着" },
    { value: "career", label: "キャリア" },
    { value: "performance", label: "成果/業務" },
    { value: "care", label: "ケア" },
  ],
  priority_level: [
    { value: "1", label: "高" },
    { value: "2", label: "中" },
    { value: "3", label: "低" },
  ],
  followup_status: [
    { value: "pending", label: "未着手" },
    { value: "in_progress", label: "進行中" },
    { value: "done", label: "完了" },
    { value: "overdue", label: "期限超過" },
  ],
};

type FollowupFormState = {
  fiscalYear: number;
  quarter: 1 | 2 | 3 | 4;
  employeeId: string;
  followupType: "retention" | "career" | "performance" | "care";
  assigneeEmployeeId: string;
  dueDate: string;
  priority: 1 | 2 | 3;
  note: string;
  status: FollowupStatus;
};

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
  const [form, setForm] = useState<FollowupFormState>({
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
  const optionsByCategory = useMasterOptions(
    ["fiscal_quarter", "followup_type", "priority_level", "followup_status"],
    followupOptionFallback
  );

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
    <form onSubmit={handleSubmit} style={{ width: "100%", display: "grid", gap: 18 }}>
      {errorMsg && <div style={errorStyle}>{errorMsg}</div>}

      <Card variant="elevated" style={{ padding: 0, overflow: "hidden" }}>
        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <CardTitle style={{ fontSize: 22 }}>🎯 フォロー割当情報</CardTitle>
            <CardText style={{ marginTop: 8, fontSize: 14 }}>
              対象社員・担当者・期限・優先度を設定してフォローを管理します。
            </CardText>
          </div>

          <div style={twoColumnGridStyle}>
            <Field label="年度" required>
              <input type="number" style={controlStyle} value={form.fiscalYear} onChange={(e) => setForm((v) => ({ ...v, fiscalYear: Number(e.target.value) }))} />
            </Field>
            <Field label="四半期" required>
              <select style={controlStyle} value={form.quarter} onChange={(e) => setForm((v) => ({ ...v, quarter: Number(e.target.value) as 1 | 2 | 3 | 4 }))}>
                {optionsByCategory.fiscal_quarter.map((item) => (
                  <option key={item.value} value={Number(item.value)}>{item.label}</option>
                ))}
              </select>
            </Field>
            <Field label="対象社員" required>
              <EmployeePicker
                label=""
                value={form.employeeId}
                onChange={(value) => setForm((v) => ({ ...v, employeeId: value }))}
              />
            </Field>
            <Field label="担当者" required>
              <EmployeePicker
                label=""
                value={form.assigneeEmployeeId}
                onChange={(value) => setForm((v) => ({ ...v, assigneeEmployeeId: value }))}
              />
            </Field>
            <Field label="面談種別" required>
              <select style={controlStyle} value={form.followupType} onChange={(e) => setForm((v) => ({ ...v, followupType: e.target.value as FollowupFormState["followupType"] }))}>
                {optionsByCategory.followup_type.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </Field>
            <Field label="期限" required>
              <input type="date" style={controlStyle} value={form.dueDate} onChange={(e) => setForm((v) => ({ ...v, dueDate: e.target.value }))} />
            </Field>
            <Field label="優先度" required>
              <select style={controlStyle} value={form.priority} onChange={(e) => setForm((v) => ({ ...v, priority: Number(e.target.value) as 1 | 2 | 3 }))}>
                {optionsByCategory.priority_level.map((item) => (
                  <option key={item.value} value={Number(item.value)}>{item.label}</option>
                ))}
              </select>
            </Field>
            <Field label="状態" required>
              <select style={controlStyle} value={form.status} onChange={(e) => setForm((v) => ({ ...v, status: e.target.value as FollowupStatus }))}>
                {optionsByCategory.followup_status.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </Field>
            <Field label="備考" wide>
              <textarea style={textareaStyle} value={form.note} onChange={(e) => setForm((v) => ({ ...v, note: e.target.value }))} />
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
const textareaStyle: CSSProperties = { ...controlStyle, height: "auto", minHeight: 120, padding: "10px 12px", resize: "vertical" };
const errorStyle: CSSProperties = { borderRadius: 12, border: "1px solid #fecaca", background: "#fef2f2", padding: "10px 12px", color: "#b91c1c", fontSize: 14 };
const actionBarStyle: CSSProperties = { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" };
const primaryButtonStyle: CSSProperties = { border: "none", borderRadius: 10, background: "#0f172a", color: "#fff", height: 40, padding: "0 18px", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: 1 };
const secondaryButtonStyle: CSSProperties = { border: "1px solid #cbd5e1", borderRadius: 10, background: "#fff", color: "#0f172a", height: 40, padding: "0 16px", fontSize: 14, fontWeight: 600, cursor: "pointer" };