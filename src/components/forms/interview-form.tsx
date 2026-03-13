// src/components/forms/interview-form.tsx
"use client";

import { CSSProperties, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { createInterviewSchema } from "@/lib/validations/interview";
import type { Me, FollowupDetail } from "@/types/api";
import { Card, CardText, CardTitle } from "@/components/ui/card";
import { EmployeePicker } from "@/components/pickers/employee-picker";
import { useMasterOptions } from "@/components/forms/use-master-options";

type FormValues = z.infer<typeof createInterviewSchema>;

const interviewOptionFallback = {
  interview_type: [
    { value: "retention", label: "定着" },
    { value: "career", label: "キャリア" },
    { value: "performance", label: "成果/業務" },
    { value: "care", label: "ケア" },
    { value: "other", label: "その他" },
  ],
  interview_visibility: [
    { value: "self", label: "本人公開" },
    { value: "manager", label: "上長まで" },
    { value: "hr", label: "人事まで" },
    { value: "private_hr", label: "人事機密" },
  ],
};


type AnnualEventPreset = {
  id: string;
  employeeId: string;
  employeeName: string;
  title: string;
  eventType: string;
  scheduledDate: string;
  status: string;
  priority: number;
  ownerEmployeeId: string;
  ownerName: string;
  description: string;
};

export function InterviewForm({
  me,
  preset,
  annualEvent,
}: {
  me: Me;
  preset: FollowupDetail | null;
  annualEvent: AnnualEventPreset | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const optionsByCategory = useMasterOptions(
    ["interview_type", "interview_visibility"],
    interviewOptionFallback
  );

  const employeeIdFromQuery = searchParams.get("employeeId") ?? undefined;

  const defaultEmployeeId =
    preset?.employeeId ??
    annualEvent?.employeeId ??
    employeeIdFromQuery ??
    "";
  const defaultInterviewerId = me.employeeId;
  
  const defaultValues: Partial<FormValues> = useMemo(() => {
    const nowIso = new Date().toISOString().slice(0, 16);
    const localDatetime = toDatetimeLocal(nowIso);

    return {
      employeeId: defaultEmployeeId,
      interviewerEmployeeId: defaultInterviewerId,
      interviewDate: localDatetime,
      interviewType:
        mapFollowupTypeToInterviewType(preset?.followupType) ??
        mapAnnualEventTypeToInterviewType(annualEvent?.eventType) ??
        "retention",
      assignmentId: preset?.id,
      annualEventId: annualEvent?.id,
      visibility: "hr",
      autoCompleteAssignment: !!preset?.id,
      autoCompleteAnnualEvent: !!annualEvent?.id,
    };
  }, [
    defaultEmployeeId,
    defaultInterviewerId,
    preset?.id,
    preset?.followupType,
    annualEvent?.id,
    annualEvent?.eventType,
  ]);

  const form = useForm<FormValues>({
    resolver: zodResolver(createInterviewSchema),
    defaultValues: defaultValues as FormValues,
    mode: "onChange",
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const payload = {
        ...values,
        interviewDate: fromDatetimeLocal(values.interviewDate),
      };

      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message ?? "保存に失敗しました");
      }

      const id = json.data.id as string;

      router.push(`/interviews/${id}`);
      router.refresh();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "保存に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  const watched = form.watch();
  const assignmentLinked = !!watched.assignmentId;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} style={{ width: "100%", display: "grid", gap: 18 }}>
      {errorMsg && <div style={errorStyle}>{errorMsg}</div>}

      {preset?.id && (
        <div style={{ ...infoStyle, background: "#f8fafc", borderColor: "#dbeafe" }}>
          <div style={{ fontWeight: 700 }}>フォロー割当から作成</div>
          <div>対象社員：{preset.employeeName}</div>
          <div>種別：{preset.followupType} / 期限：{preset.dueDate}</div>
          <div>担当：{preset.assigneeName}</div>
        </div>
      )}

      {annualEvent?.id && (
        <div style={{ ...infoStyle, background: "#eff6ff", borderColor: "#bfdbfe" }}>
          <div style={{ fontWeight: 700 }}>年間イベントから作成</div>
          <div>対象社員：{annualEvent.employeeName}</div>
          <div>タイトル：{annualEvent.title}</div>
          <div>予定日：{annualEvent.scheduledDate}</div>
          <div>担当：{annualEvent.ownerName}</div>
        </div>
      )}

      <Card variant="elevated" style={{ padding: 0, overflow: "hidden" }}>
        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <CardTitle style={{ fontSize: 22 }}>📝 基本情報</CardTitle>
            <CardText style={{ marginTop: 8, fontSize: 14 }}>
              面談の対象者・実施者・日時・公開範囲を設定します。
            </CardText>
          </div>
          
          <div style={twoColumnGridStyle}>
            <Field label="対象社員" required>
              <EmployeePicker
                label=""
                value={watched.employeeId}
                onChange={(value) => form.setValue("employeeId", value, { shouldDirty: true, shouldValidate: true })}
              />
              <ErrorText msg={form.formState.errors.employeeId?.message} />
            </Field>

            <Field label="面談者" hint="通常はログイン者のemployeeIdを自動セット" required>
              <EmployeePicker
                label=""
                value={watched.interviewerEmployeeId}
                onChange={(value) => form.setValue("interviewerEmployeeId", value, { shouldDirty: true, shouldValidate: true })}
              />
              <ErrorText msg={form.formState.errors.interviewerEmployeeId?.message} />
            </Field>

            <Field label="面談日時" required>
              <input type="datetime-local" style={controlStyle} {...form.register("interviewDate")} />
              <ErrorText msg={form.formState.errors.interviewDate?.message} />
            </Field>

            <Field label="面談種別" required>
              <select style={controlStyle} {...form.register("interviewType")}>
                {optionsByCategory.interview_type.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
              <ErrorText msg={form.formState.errors.interviewType?.message} />
            </Field>

            <Field label="公開範囲" required>
              <select style={controlStyle} {...form.register("visibility")}>
                {optionsByCategory.interview_visibility.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
              <ErrorText msg={form.formState.errors.visibility?.message} />
            </Field>

            <label style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
              <span style={fieldLabelStyle}>連携設定</span>
              <div style={{ display: "grid", gap: 8, fontSize: 14 }}>
                <label style={checkboxLabelStyle}>
                  <input type="checkbox" {...form.register("autoCompleteAssignment")} />
                  フォロー割当を完了化する
                </label>
                <label style={checkboxLabelStyle}>
                  <input type="checkbox" {...form.register("autoCompleteAnnualEvent")} />
                  年間イベントを完了化する
                </label>
                {assignmentLinked && <div style={subtleTextStyle}>assignmentId: {watched.assignmentId}</div>}
                {!!watched.annualEventId && <div style={subtleTextStyle}>annualEventId: {watched.annualEventId}</div>}
              </div>
            </label>
          </div>
        </section>
      </Card>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <section style={{ ...sectionStyle, background: "#ffffff" }}>
          <div style={sectionHeaderStyle}>
            <CardTitle style={{ fontSize: 22 }}>🗂️ 面談内容</CardTitle>
            <CardText style={{ marginTop: 8, fontSize: 14 }}>
              面談の事実・発言・課題・対応方針を記録します。
            </CardText>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            <Field label="事実（観察・出来事）" hint="評価や解釈ではなく、起きたことを記述" wide>
              <textarea style={textareaStyle} {...form.register("factsObserved")} />
            </Field>

            <Field label="本人の発言" wide>
              <textarea style={textareaStyle} {...form.register("employeeVoice")} />
            </Field>

            <Field label="良かった点" wide>
              <textarea style={textareaStyle} {...form.register("positivePoints")} />
            </Field>

            <Field label="課題" wide>
              <textarea style={textareaStyle} {...form.register("issues")} />
            </Field>

            <Field label="対応方針" wide>
              <textarea style={textareaStyle} {...form.register("responsePolicy")} />
            </Field>

            <div style={subtleTextStyle}>
              ※「事実/発言/良かった点/課題/方針」のいずれかは必須（空欄のみ保存不可）
            </div>
            <ErrorText msg={form.formState.errors.root?.message} />
          </div>
        </section>
      </Card>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <section style={{ ...sectionStyle, background: "#ffffff" }}>
          <div style={sectionHeaderStyle}>
            <CardTitle style={{ fontSize: 22 }}>✅ 次回アクション</CardTitle>
            <CardText style={{ marginTop: 8, fontSize: 14 }}>
              次回までに実施する本人・会社側のアクションを整理します。
            </CardText>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            <Field label="本人アクション（次回まで）" wide>
              <textarea style={textareaStyle} {...form.register("actionEmployee")} />
            </Field>

            <Field label="会社/上長アクション（次回まで）" wide>
              <textarea style={textareaStyle} {...form.register("actionCompany")} />
            </Field>

            <Field label="次回面談予定日（任意)">
              <input type="date" style={controlStyle} {...form.register("nextInterviewDate")} />
            </Field>
          </div>
        </section>
      </Card>

      <div style={actionBarStyle}>
        <button type="submit" disabled={submitting} style={primaryButtonStyle}>
          {submitting ? "保存中..." : "保存する"}
        </button>

        <button type="button" onClick={() => router.back()} style={secondaryButtonStyle}>
          戻る
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  required,
  children,
  wide,
}: {
  label: string;
  hint?: string;
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
      {hint && <span style={hintStyle}>{hint}</span>}
      {children}
    </label>
  );
}

function ErrorText({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <div style={{ color: "#dc2626", fontSize: 12 }}>{msg}</div>;
}

function mapFollowupTypeToInterviewType(v?: string) {
  if (!v) return null;
  if (v === "retention") return "retention";
  if (v === "career") return "career";
  if (v === "performance") return "performance";
  if (v === "care") return "care";
  return "other";
}

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function fromDatetimeLocal(local: string) {
  const d = new Date(local);
  return d.toISOString();
}

function mapAnnualEventTypeToInterviewType(v?: string) {
  if (!v) return null;
  if (v === "interview") return "retention";
  return "other";
}

const sectionStyle: CSSProperties = { padding: 26, background: "#f8fafc" };
const sectionHeaderStyle: CSSProperties = { borderBottom: "1px solid #e2e8f0", paddingBottom: 14, marginBottom: 16 };
const twoColumnGridStyle: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 };
const fieldStyle: CSSProperties = { display: "grid", gap: 6, minWidth: 0 };
const fieldLabelStyle: CSSProperties = { fontSize: 13, fontWeight: 700, color: "#1f2937" };
const hintStyle: CSSProperties = { fontSize: 12, color: "#64748b" };
const controlStyle: CSSProperties = { height: 40, border: "1px solid #cbd5e1", borderRadius: 10, padding: "0 12px", fontSize: 14, background: "#fff" };
const textareaStyle: CSSProperties = { ...controlStyle, height: "auto", minHeight: 100, padding: "10px 12px", resize: "vertical" };
const checkboxLabelStyle: CSSProperties = { display: "inline-flex", alignItems: "center", gap: 8, color: "#0f172a" };
const subtleTextStyle: CSSProperties = { fontSize: 12, color: "#64748b" };
const errorStyle: CSSProperties = { borderRadius: 12, border: "1px solid #fecaca", background: "#fef2f2", padding: "10px 12px", color: "#b91c1c", fontSize: 14 };
const infoStyle: CSSProperties = { borderRadius: 12, border: "1px solid", padding: "10px 12px", fontSize: 14, color: "#1f2937", display: "grid", gap: 2 };
const actionBarStyle: CSSProperties = { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" };
const primaryButtonStyle: CSSProperties = { border: "none", borderRadius: 10, background: "#0f172a", color: "#fff", height: 40, padding: "0 18px", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: 1 };
const secondaryButtonStyle: CSSProperties = { border: "1px solid #cbd5e1", borderRadius: 10, background: "#fff", color: "#0f172a", height: 40, padding: "0 16px", fontSize: 14, fontWeight: 600, cursor: "pointer" };