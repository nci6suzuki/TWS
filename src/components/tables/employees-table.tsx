// src/components/tables/employees-table.tsx
import { DataTable, Column } from "@/components/tables/data-table";
import type { EmployeeListItem, Me, Pagination } from "@/types/api";
import { InviteEmployeeButton } from "@/components/employees/invite-employee-button";

function StatusBadge({ status }: { status: string }) {
  const styleMap: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    leave: "bg-amber-50 text-amber-700 border-amber-200",
    inactive: "bg-slate-100 text-slate-600 border-slate-200",
  };

  const labelMap: Record<string, string> = {
    active: "在籍",
    leave: "休職",
    inactive: "退職/無効",
  };

  const className = styleMap[status] ?? styleMap.inactive;
  const label = labelMap[status] ?? status;

  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

export function EmployeesTable({
  me,
  data,
  pagination,
}: {
  me: Me;
  data: EmployeeListItem[];
  pagination: Pagination;
}) {
  const columns: Column<EmployeeListItem>[] = [
    { key: "employeeCode", header: "社員番号", render: (r) => r.employeeCode, className: "whitespace-nowrap" },
    { key: "name", header: "氏名", render: (r) => r.name, className: "min-w-[120px]" },
    { key: "email", header: "メール", render: (r) => r.email || "-", className: "min-w-[180px]" },
    { key: "branch", header: "支店", render: (r) => r.branchName || "-" },
    { key: "department", header: "部署", render: (r) => r.departmentName || "-" },
    { key: "position", header: "役職", render: (r) => r.positionName || "-" },
    { key: "status", header: "状態", render: (r) => <StatusBadge status={r.status} />, className: "whitespace-nowrap" },
    {
      key: "invite",
      header: "アカウント",
      className: "whitespace-nowrap",
      render: (r) => (
        <InviteEmployeeButton
          employeeId={r.id}
          email={r.email || ""}
          hasUserId={!!r.userId}
        />
      ),
    },
    {
      key: "inviteStatus",
      header: "招待",
      className: "min-w-[180px]",
      render: (r) => (
        <div className="text-xs text-slate-600 space-y-1">
          <div>{r.userId ? "アカウント紐づけ済み" : "未招待/未紐づけ"}</div>
          <div>
            {r.lastInvitedAt
              ? `最終招待: ${new Date(r.lastInvitedAt).toLocaleString()}`
              : "最終招待: -"}
          </div>
          <div>{r.invitedByName ? `実行者: ${r.invitedByName}` : ""}</div>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={data}
      pagination={pagination}
      makeHref={(r) => `/employees/${r.id}?tab=basic`}
      emptyMessage={me.role === "manager" ? "表示可能な社員データがありません" : "データがありません"}
    />
  );
}