// src/components/tables/employees-table.tsx
import { DataTable, Column } from "@/components/tables/data-table";
import type { EmployeeListItem, Me, Pagination } from "@/types/api";
import { InviteEmployeeButton } from "@/components/employees/invite-employee-button";

export function EmployeesTable({
  me,
  data,
  pagination,
}: {
  me: Me;
  data: EmployeeListItem[];
  pagination: Pagination;
}) {
type EmployeeListItem = {
  id: string;
  userId?: string | null;
  employeeCode: string;
  name: string;
  email?: string;
  branchName: string;
  departmentName: string;
  positionName: string;
  gradeName: string;
  status: string;
};

const columns: Column<EmployeeListItem>[] = [
  { key: "employeeCode", header: "社員番号", render: (r) => r.employeeCode },
  { key: "name", header: "氏名", render: (r) => r.name },
  { key: "email", header: "メール", render: (r) => r.email || "-" },
  { key: "branch", header: "支店", render: (r) => r.branchName },
  { key: "department", header: "部署", render: (r) => r.departmentName },
  { key: "position", header: "役職", render: (r) => r.positionName },
  { key: "status", header: "状態", render: (r) => r.status },
  {
    key: "invite",
    header: "アカウント",
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
    render: (r) => (
    <div className="text-xs space-y-1">
      <div>{r.userId ? "アカウント紐づけ済み" : "未招待/未紐づけ"}</div>
      <div>{r.lastInvitedAt ? `最終招待: ${new Date(r.lastInvitedAt).toLocaleString()}` : "-"}</div>
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
    />
  );
}