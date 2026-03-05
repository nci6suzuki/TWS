// src/components/employees/panels/employee-basic-panel.tsx
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Me } from "@/types/api";
import { InviteEmployeeButton } from "@/components/employees/invite-employee-button";

export async function EmployeeBasicPanel({
  me,
  employeeId,
}: {
  me: Me;
  employeeId: string;
}) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("employees")
    .select(`
      id,
      user_id,
      employee_code,
      name,
      email,
      employment_type,
      hire_date,
      status,
      branch_id,
      department_id,
      position_id,
      grade_id,
      manager_employee_id,
      mentor_employee_id
    `)
    .eq("id", employeeId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return <div>データがありません。</div>;

  const canEdit = me.role === "admin" || me.role === "hr";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-medium">基本情報</h2>
        <div className="flex gap-2">
          {canEdit && (
            <InviteEmployeeButton
            employeeId={employeeId}
            email={data.email ?? ""}
            hasUserId={!!data.user_id}
            />
          )}
          {canEdit && (
            <Link className="underline text-sm" href={`/employees/${employeeId}/edit`}>
              編集
            </Link>
          )}
        </div>
      </div>

      <div className="border rounded p-4 space-y-2 text-sm">
        <Row label="社員番号" value={data.employee_code ?? "-"} />
        <Row label="氏名" value={data.name ?? "-"} />
        <Row label="メール" value={data.email ?? "-"} />
        <Row label="雇用区分" value={data.employment_type ?? "-"} />
        <Row label="入社日" value={data.hire_date ?? "-"} />
        <Row label="状態" value={data.status ?? "-"} />
        <Row label="支店ID" value={data.branch_id ?? "-"} />
        <Row label="部署ID" value={data.department_id ?? "-"} />
        <Row label="役職ID" value={data.position_id ?? "-"} />
        <Row label="等級ID" value={data.grade_id ?? "-"} />
        <Row label="直属上長ID" value={data.manager_employee_id ?? "-"} />
        <Row label="メンターID" value={data.mentor_employee_id ?? "-"} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex border-b last:border-b-0 py-2">
      <div className="w-40 font-medium">{label}</div>
      <div className="flex-1">{value}</div>
    </div>
  );
}