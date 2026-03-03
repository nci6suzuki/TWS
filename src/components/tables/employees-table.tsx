// src/components/tables/employees-table.tsx
import { DataTable, Column } from "@/components/tables/data-table";
import type { EmployeeListItem, Me, Pagination } from "@/types/api";

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
    { key: "name", header: "氏名", render: (r) => r.name },
    { key: "employeeCode", header: "社員番号", render: (r) => r.employeeCode },
    { key: "branch", header: "支店", render: (r) => r.branchName },
    { key: "dept", header: "部署", render: (r) => r.departmentName ?? "" },
    { key: "pos", header: "役職", render: (r) => r.positionName ?? "" },
    { key: "grade", header: "等級", render: (r) => r.gradeName ?? "" },
    { key: "status", header: "状態", render: (r) => r.status },
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