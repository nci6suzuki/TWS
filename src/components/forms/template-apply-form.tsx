// src/components/forms/template-bulk-apply-form.tsx
"use client";

import { useState } from "react";
import { TemplateSelect } from "@/components/selects/template-select";
import { BranchSelect } from "@/components/selects/branch-select";
import { DepartmentSelect } from "@/components/selects/department-select";
import { PositionSelect } from "@/components/selects/position-select";
import { GradeSelect } from "@/components/selects/grade-select";

type Result = {
  targetCount: number;
  createdCount: number;
  skippedCount: number;
  details: Array<{
    employeeId: string;
    status: "created" | "skipped" | "error";
    reason?: string;
  }>;
};

export function TemplateBulkApplyForm() {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const [form, setForm] = useState({
    templateId: "",
    branchId: "",
    departmentId: "",
    positionId: "",
    gradeId: "",
    employmentType: "",
    hireDateFrom: "",
    hireDateTo: "",
    skipIfAlreadyHasEvents: true,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const res = await fetch("/api/templates/bulk-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message ?? "一括適用に失敗しました");
      }

      setResult(json.data);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "一括適用に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4 border rounded p-4">
        {errorMsg && <div className="p-3 border rounded bg-red-50 text-sm">{errorMsg}</div>}

        <Field label="テンプレート">
          <TemplateSelect
            value={form.templateId}
            onChange={(value) => setForm((v) => ({ ...v, templateId: value }))}
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="支店">
            <BranchSelect
              value={form.branchId}
              onChange={(value) =>
                setForm((v) => ({ ...v, branchId: value, departmentId: "" }))
              }
            />
          </Field>

          <Field label="部署">
            <DepartmentSelect
              branchId={form.branchId}
              value={form.departmentId}
              onChange={(value) => setForm((v) => ({ ...v, departmentId: value }))}
            />
          </Field>

          <Field label="役職">
            <PositionSelect
              value={form.positionId}
              onChange={(value) => setForm((v) => ({ ...v, positionId: value }))}
            />
          </Field>

          <Field label="等級">
            <GradeSelect
              value={form.gradeId}
              onChange={(value) => setForm((v) => ({ ...v, gradeId: value }))}
            />
          </Field>

          <Field label="雇用区分">
            <select
              className="border rounded p-2 w-full"
              value={form.employmentType}
              onChange={(e) => setForm((v) => ({ ...v, employmentType: e.target.value }))}
            >
              <option value="">すべて</option>
              <option value="full_time">正社員</option>
              <option value="contract">契約社員</option>
              <option value="part_time">パート</option>
              <option value="other">その他</option>
            </select>
          </Field>

          <Field label="入社日 From">
            <input
              type="date"
              className="border rounded p-2 w-full"
              value={form.hireDateFrom}
              onChange={(e) => setForm((v) => ({ ...v, hireDateFrom: e.target.value }))}
            />
          </Field>

          <Field label="入社日 To">
            <input
              type="date"
              className="border rounded p-2 w-full"
              value={form.hireDateTo}
              onChange={(e) => setForm((v) => ({ ...v, hireDateTo: e.target.value }))}
            />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.skipIfAlreadyHasEvents}
            onChange={(e) =>
              setForm((v) => ({ ...v, skipIfAlreadyHasEvents: e.target.checked }))
            }
          />
          既存イベントがある社員はスキップする
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded border bg-black text-white disabled:opacity-50"
        >
          {submitting ? "適用中..." : "一括適用する"}
        </button>
      </form>

      {result && (
        <div className="space-y-3 border rounded p-4">
          <div className="font-medium">実行結果</div>
          <div className="text-sm">対象社員数：{result.targetCount}</div>
          <div className="text-sm">作成イベント数：{result.createdCount}</div>
          <div className="text-sm">スキップ/エラー件数：{result.skippedCount}</div>

          <div className="border rounded">
            <ul>
              {result.details.map((row, i) => (
                <li key={`${row.employeeId}-${i}`} className="p-3 border-b last:border-b-0 text-sm">
                  <div>社員ID：{row.employeeId}</div>
                  <div>状態：{row.status}</div>
                  {row.reason && <div>理由：{row.reason}</div>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
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