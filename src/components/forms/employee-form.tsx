"use client";

import { CSSProperties, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Me } from "@/types/api";
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

type MasterOption = { id: string; name: string };
type DepartmentOption = MasterOption & { branchId: string | null };

type EmployeeFormMasterOptions = {
  branches: MasterOption[];
  departments: DepartmentOption[];
  positions: MasterOption[];
  grades: MasterOption[];
};

export function EmployeeForm({
  mode,
  me,
  initialData,
  masterOptions,
}: {
  mode: "create" | "edit";
  me: Me;
  initialData?: EmployeeFormData;
  masterOptions?: EmployeeFormMasterOptions;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [clientMasterOptions, setClientMasterOptions] = useState<EmployeeFormMasterOptions | null>(masterOptions ?? null);

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


  useEffect(() => {
    if (masterOptions) return;
    let active = true;

    async function loadMasterOptions() {
      try {
        const [b, d, p, g] = await Promise.all([
          fetch("/api/masters/branches", { cache: "no-store" }).then((r) => r.json()),
          fetch("/api/masters/departments", { cache: "no-store" }).then((r) => r.json()),
          fetch("/api/masters/positions", { cache: "no-store" }).then((r) => r.json()),
          fetch("/api/masters/grades", { cache: "no-store" }).then((r) => r.json()),
        ]);

        if (!active) return;

        setClientMasterOptions({
          branches: b?.data?.items ?? [],
          departments: (d?.data?.items ?? []).map((item: any) => ({
            id: item.id,
            name: item.name ?? "",
            branchId: item.branch_id ?? item.branchId ?? null,
          })),
          positions: p?.data?.items ?? [],
          grades: g?.data?.items ?? [],
        });
      } catch {
        if (active) {
          setClientMasterOptions({ branches: [], departments: [], positions: [], grades: [] });
        }
      }
    }

    loadMasterOptions();
    return () => {
      active = false;
    };
  }, [masterOptions]);

  const resolvedMasterOptions = masterOptions ?? clientMasterOptions;
  const branches = resolvedMasterOptions?.branches ?? [];
  const positions = resolvedMasterOptions?.positions ?? [];
  const grades = resolvedMasterOptions?.grades ?? [];

  const filteredDepartments = useMemo(() => {
    const departments = resolvedMasterOptions?.departments ?? [];
    if (!form.branchId) return departments;
    return departments.filter((item) => item.branchId === form.branchId);
  }, [form.branchId, resolvedMasterOptions?.departments]);

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
    <form onSubmit={handleSubmit} style={{ width: "100%", display: "grid", gap: 18 }}>
      {errorMsg && (
        <div style={{ borderRadius: 12, border: "1px solid #fecaca", background: "#fef2f2", padding: "10px 12px", color: "#b91c1c", fontSize: 14 }}>
          {errorMsg}
        </div>
      )}

      <Card variant="elevated" style={{ padding: 0, overflow: "hidden" }}>
        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <CardTitle style={{ fontSize: 22 }}>🧾 基本情報</CardTitle>
            <CardText style={{ marginTop: 8, fontSize: 14 }}>社員マスタに必要な項目を入力してください。</CardText>
          </div>

          <div style={twoColumnGridStyle}>
            <Field label="社員番号" required>
              <input style={controlStyle} placeholder="例: A00123" value={form.employeeCode} onChange={(e) => setForm((v) => ({ ...v, employeeCode: e.target.value }))} />
            </Field>

            <Field label="氏名" required>
              <input style={controlStyle} placeholder="例: 山田 太郎" value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} />
            </Field>

            <Field label="メールアドレス" required wide>
              <input type="email" style={controlStyle} placeholder="name@example.co.jp" value={form.email} onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))} />
            </Field>
            <Field label="雇用区分" required>
              <select style={controlStyle} value={form.employmentType} onChange={(e) => setForm((v) => ({ ...v, employmentType: e.target.value }))}>
                <option value="full_time">正社員</option>
                <option value="contract">契約社員</option>
                <option value="part_time">パート</option>
                <option value="other">その他</option>
              </select>
            </Field>
            <Field label="入社日">
              <input type="date" style={controlStyle} value={form.hireDate} onChange={(e) => setForm((v) => ({ ...v, hireDate: e.target.value }))} />
            </Field>

            <Field label="支店" required>
              <select style={controlStyle} value={form.branchId} onChange={(e) => setForm((v) => ({ ...v, branchId: e.target.value, departmentId: "" }))}>
                <option value="">支店を選択</option>
                {branches.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </Field>
            <Field label="部署" required>
              <select style={controlStyle} value={form.departmentId} onChange={(e) => setForm((v) => ({ ...v, departmentId: e.target.value }))}>
                <option value="">部署を選択</option>
                {filteredDepartments.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </Field>
            <Field label="役職" required>
              <select style={controlStyle} value={form.positionId} onChange={(e) => setForm((v) => ({ ...v, positionId: e.target.value }))}>
                <option value="">役職を選択</option>
                {positions.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </Field>

            <Field label="等級" required>
              <select style={controlStyle} value={form.gradeId} onChange={(e) => setForm((v) => ({ ...v, gradeId: e.target.value }))}>
                <option value="">等級を選択</option>
                {grades.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </Field>

            <Field label="在籍状態" required>
              <select style={controlStyle} value={form.status} onChange={(e) => setForm((v) => ({ ...v, status: e.target.value }))}>
                <option value="active">在籍</option>
                <option value="leave">休職</option>
                <option value="inactive">退職/無効</option>
              </select>
            </Field>
          </div>
        </section>
      </Card>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <section style={{ ...sectionStyle, background: "#ffffff" }}>
          <div style={sectionHeaderStyle}>
            <CardTitle style={{ fontSize: 22 }}>🌱 組織・育成設定</CardTitle>
            <CardText style={{ marginTop: 8, fontSize: 14 }}>育成体制や初期テンプレートの紐づけを設定します。</CardText>
          </div>

          <div style={twoColumnGridStyle}>
            <div style={{ minWidth: 0 }}>
              <EmployeePicker label="直属上長" value={form.managerEmployeeId} onChange={(value) => setForm((v) => ({ ...v, managerEmployeeId: value }))} />
            </div>
            <div style={{ minWidth: 0 }}>
              <EmployeePicker label="メンター" value={form.mentorEmployeeId} onChange={(value) => setForm((v) => ({ ...v, mentorEmployeeId: value }))} />
            </div>
            <Field label="年間イベントテンプレート" wide>
              <TemplateSelect value={form.templateId ?? ""} onChange={(value) => setForm((v) => ({ ...v, templateId: value || null }))} />
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
        <span style={{ fontSize: 12, color: "#64748b" }}>* は必須項目です</span>
      </div>

      {me.role === "admin" && (
        <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
          管理者は登録完了後に一覧画面からアカウント招待を実行できます。
        </p>
      )}
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

const sectionStyle: CSSProperties = {
  padding: 26,
  background: "#f8fafc",
};

const sectionHeaderStyle: CSSProperties = {
  borderBottom: "1px solid #e2e8f0",
  paddingBottom: 14,
  marginBottom: 16,
};

const twoColumnGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 14,
};

const fieldStyle: CSSProperties = {
  display: "grid",
  gap: 6,
  minWidth: 0,
};

const fieldLabelStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "#334155",
};

const controlStyle: CSSProperties = {
  width: "100%",
  height: 42,
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  padding: "0 12px",
  fontSize: 14,
  color: "#0f172a",
  background: "#fff",
  boxSizing: "border-box",
};

const actionBarStyle: CSSProperties = {
  position: "sticky",
  bottom: 12,
  zIndex: 10,
  borderRadius: 14,
  border: "1px solid #e2e8f0",
  background: "rgba(255,255,255,0.96)",
  padding: 12,
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  alignItems: "center",
};

const primaryButtonStyle: CSSProperties = {
  height: 42,
  borderRadius: 10,
  border: "none",
  padding: "0 18px",
  fontWeight: 700,
  color: "#fff",
  background: "#0f172a",
  cursor: "pointer",
};

const secondaryButtonStyle: CSSProperties = {
  height: 42,
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  padding: "0 18px",
  fontWeight: 700,
  color: "#334155",
  background: "#fff",
  cursor: "pointer",
};