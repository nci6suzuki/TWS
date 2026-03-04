// src/components/tables/annual-events-table.tsx
import { DataTable, Column } from "@/components/tables/data-table";
import { Pagination } from "@/types/api";

type AnnualEventItem = {
  id: string;
  employeeName: string;
  title: string;
  eventType: string;
  scheduledDate: string;
  status: string;
  priority: number;
  ownerName: string;
};

export function AnnualEventsTable({
  data,
  pagination,
}: {
  data: AnnualEventItem[];
  pagination: Pagination;
}) {
  const columns: Column<AnnualEventItem>[] = [
    { key: "employee", header: "対象社員", render: (r) => r.employeeName },
    { key: "title", header: "タイトル", render: (r) => r.title },
    { key: "type", header: "種別", render: (r) => r.eventType },
    { key: "date", header: "予定日", render: (r) => r.scheduledDate },
    { key: "owner", header: "担当者", render: (r) => r.ownerName },
    { key: "status", header: "状態", render: (r) => r.status },
  ];

  return (
    <DataTable
      columns={columns}
      rows={data}
      pagination={pagination}
      makeHref={(r) => `/annual-events/${r.id}`}
    />
  );
}