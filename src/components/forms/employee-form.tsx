"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Me } from "@/types/api";
import { BranchSelect } from "@/components/selects/branch-select";
import { DepartmentSelect } from "@/components/selects/department-select";
import { PositionSelect } from "@/components/selects/position-select";
import { GradeSelect } from "@/components/selects/grade-select";
import { EmployeePicker } from "@/components/pickers/employee-picker";
import { TemplateSelect } from "@/components/selects/template-select";
import { Card, CardText, CardTitle } from "@/components/ui/card";

type EmployeeFormData = {
  id?: string;
  employeeCode: string;
  name: string;
  email: string;
  branchId: string;
  departmentId: string;
  positionId: string;
  gradeId: string;
  employmentType: string;
  hireDate: string;
  managerEmployeeId: string;
  mentorEmployeeId: string;
  status: string;
  templateId?: string | null;
};

const controlClassName =
  "h-11 w-full rounded-xl border border-slate-300/90 bg-white/95 px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

export function EmployeeForm({
  mode,
  me,
  initialData,
}: {
  mode: "create" | "edit";
  me: Me;
  initialData?: EmployeeFormData;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [form, setForm] = useState<EmployeeFormData>({
    id: initialData?.id,
    employeeCode: initialData?.employeeCode ?? "",
    name: initialData?.name ?? "",
    email: initialData?.email ?? "",
    branchId: initialData?.branchId ?? "",
    departmentId: initialData?.departmentId ?? "",
    positionId: initialData?.positionId ?? "",
    gradeId: initialData?.gradeId ?? "",
    employmentType: initialData?.employmentType ?? "full_time",
    hireDate: initialData?.hireDate ?? "",
    managerEmployeeId: initialData?.managerEmployeeId ?? "",
    mentorEmployeeId: initialData?.mentorEmployeeId ?? "",
    status: initialData?.status ?? "active",
    templateId: initialData?.templateId ?? null,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    try {
      const url = mode === "create" ? "/api/employees" : `/api/employees/${initialData?.id}`;

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
      router.push(`/employees/${id}?tab=basic`);
      router.refresh();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <Card variant="elevated" style={{ padding: 0 }}>
        <section className="rounded-2xl p-5 sm:p-6">
          <div className="mb-5 border-b border-slate-200 pb-4">
            <CardTitle style={{ fontSize: 17 }}>🧾 基本情報</CardTitle>
            <CardText style={{ marginTop: 8, fontSize: 13 }}>
              社員マスタに必要な必須項目を先に入力します。
            </CardText>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="社員番号" required>
              <input
                className={controlClassName}
                placeholder="例: A00123"
                value={form.employeeCode}
                onChange={(e) => setForm((v) => ({ ...v, employeeCode: e.target.value }))}
              />
            </Field>

            <Field label="氏名" required>
              <input
                className={controlClassName}
                placeholder="例: 山田 太郎"
                value={form.name}
                onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))}
              />
            </Field>

            <Field label="メールアドレス" required>
              <input
                type="email"
                className={controlClassName}
                placeholder="name@example.co.jp"
                value={form.email}
                onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))}
              />
            </Field>

            <Field label="雇用区分" required>
              <select
                className={controlClassName}
                value={form.employmentType}
                onChange={(e) => setForm((v) => ({ ...v, employmentType: e.target.value }))}
              >
                <option value="full_time">正社員</option>
                <option value="contract">契約社員</option>
                <option value="part_time">パート</option>
                <option value="other">その他</option>
              </select>
            </Field>

            <Field label="支店" required>
              <BranchSelect
                value={form.branchId}
                onChange={(value) => setForm((v) => ({ ...v, branchId: value, departmentId: "" }))}
              />
            </Field>

            <Field label="部署" required>
              <DepartmentSelect
                branchId={form.branchId}
                value={form.departmentId}
                onChange={(value) => setForm((v) => ({ ...v, departmentId: value }))}
              />
            </Field>

            <Field label="役職" required>
              <PositionSelect
                value={form.positionId}
                onChange={(value) => setForm((v) => ({ ...v, positionId: value }))}
              />
            </Field>

            <Field label="等級" required>
              <GradeSelect
                value={form.gradeId}
                onChange={(value) => setForm((v) => ({ ...v, gradeId: value }))}
              />
            </Field>

            <Field label="入社日">
              <input
                type="date"
                className={controlClassName}
                value={form.hireDate}
                onChange={(e) => setForm((v) => ({ ...v, hireDate: e.target.value }))}
              />
            </Field>

            <Field label="在籍状態" required>
              <select
                className={controlClassName}
                value={form.status}
                onChange={(e) => setForm((v) => ({ ...v, status: e.target.value }))}
              >
                <option value="active">在籍</option>
                <option value="leave">休職</option>
                <option value="inactive">退職/無効</option>
              </select>
            </Field>
          </div>
        </section>
      </Card>

      <Card style={{ padding: 0 }}>
        <section className="rounded-2xl p-5 sm:p-6">
          <div className="mb-5 border-b border-slate-200 pb-4">
            <CardTitle style={{ fontSize: 17 }}>🌱 組織・育成設定</CardTitle>
            <CardText style={{ marginTop: 8, fontSize: 13 }}>
              育成体制や初期テンプレートの紐づけを設定します。
            </CardText>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <EmployeePicker
              label="直属上長"
              value={form.managerEmployeeId}
              onChange={(value) => setForm((v) => ({ ...v, managerEmployeeId: value }))}
            />

            <EmployeePicker
              label="メンター"
              value={form.mentorEmployeeId}
              onChange={(value) => setForm((v) => ({ ...v, mentorEmployeeId: value }))}
            />

            <div className="sm:col-span-2">
              <Field label="年間イベントテンプレート">
                <TemplateSelect
                  value={form.templateId ?? ""}
                  onChange={(value) => setForm((v) => ({ ...v, templateId: value || null }))}
                />
              </Field>
            </div>
          </div>
        </section>
      </Card>

      <div className="sticky bottom-3 z-10 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "保存中..." : "保存する"}
          </button>
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={() => router.back()}
          >
            戻る
          </button>
          <span className="text-xs text-slate-500">* は必須項目です</span>
        </div>
      </div>

      {me.role === "admin" && (
        <p className="text-xs text-slate-500">管理者は登録完了後に一覧画面からアカウント招待を実行できます。</p>
      )}
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </span>
      {children}
    </label>
  );
}