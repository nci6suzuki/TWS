"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Me } from "@/types/api";
import { BranchSelect } from "@/components/selects/branch-select";
import { DepartmentSelect } from "@/components/selects/department-select";
import { PositionSelect } from "@/components/selects/position-select";
import { GradeSelect } from "@/components/selects/grade-select";
import { EmployeePicker } from "@/components/pickers/employee-picker";

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
};

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
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    try {
      const url =
        mode === "create"
          ? "/api/employees"
          : `/api/employees/${initialData?.id}`;

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
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div className="p-3 border rounded bg-red-50 text-sm">{errorMsg}</div>
      )}

      <Field label="社員番号">
        <input
          className="border rounded p-2 w-full"
          value={form.employeeCode}
          onChange={(e) => setForm((v) => ({ ...v, employeeCode: e.target.value }))}
        />
      </Field>

      <Field label="氏名">
        <input
          className="border rounded p-2 w-full"
          value={form.name}
          onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))}
        />
      </Field>

      <Field label="メールアドレス">
        <input
          type="email"
          className="border rounded p-2 w-full"
          value={form.email}
          onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))}
        />
      </Field>

<Field label="支店">
  <BranchSelect
    value={form.branchId}
    onChange={(value) => setForm((v) => ({ ...v, branchId: value, departmentId: "" }))}
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
          <option value="full_time">正社員</option>
          <option value="contract">契約社員</option>
          <option value="part_time">パート</option>
          <option value="other">その他</option>
        </select>
      </Field>

      <Field label="入社日">
        <input
          type="date"
          className="border rounded p-2 w-full"
          value={form.hireDate}
          onChange={(e) => setForm((v) => ({ ...v, hireDate: e.target.value }))}
        />
      </Field>

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

      <Field label="在籍状態">
        <select
          className="border rounded p-2 w-full"
          value={form.status}
          onChange={(e) => setForm((v) => ({ ...v, status: e.target.value }))}
        >
          <option value="active">在籍</option>
          <option value="leave">休職</option>
          <option value="inactive">退職/無効</option>
        </select>
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