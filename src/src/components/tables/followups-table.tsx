// src/components/tables/followups-table.tsx
import Link from "next/link";
import { DataTable, Column } from "@/components/tables/data-table";
import type { FollowupListItem, Me, Pagination } from "@/types/api";

export function FollowupsTable({
  me,
  data,
  pagination,
}: {
  me: Me;
  data: FollowupListItem[];
  pagination: Pagination;
}) {
  const columns: Column<FollowupListItem>[] = [
    { key: "employee", header: "対象社員", render: (r) => r.employeeName },
    { key: "branch", header: "支店", render: (r) => r.branchName },
    { key: "type", header: "種別", render: (r) => r.followupType },
    { key: "assignee", header: "担当者", render: (r) => r.assigneeName },
    {
      key: "due",
      header: "期限",
      render: (r) => (
        <span className={r.status === "overdue" ? "text-red-600 font-medium" : ""}>
          {r.dueDate}
        </span>
      ),
    },
    { key: "status", header: "状態", render: (r) => r.status },
    {
      key: "actions",
      header: "操作",
      render: (r) => (
        <div className="flex gap-2">
          <Link className="underline" href={`/followups/${r.id}`}>詳細</Link>
          <Link className="underline" href={`/interviews/new?assignmentId=${r.id}`}>記録</Link>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={data}
      pagination={pagination}
      makeHref={(r) => `/followups/${r.id}`}
    />
  );
}