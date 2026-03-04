// src/components/tables/data-table.tsx
import Link from "next/link";
import { Pagination } from "@/types/api";

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
};

export function DataTable<T>({
  columns,
  rows,
  pagination,
  makeHref,
}: {
  columns: Column<T>[];
  rows: T[];
  pagination?: Pagination;
  makeHref?: (row: T) => string;
}) {
  return (
    <div className="border rounded overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={"text-left p-2 border-b " + (c.className ?? "")}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="p-3 text-gray-600" colSpan={columns.length}>
                データがありません
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => {
              const href = makeHref?.(row);
              return (
                <tr key={idx} className="border-b last:border-b-0 hover:bg-gray-50">
                  {columns.map((c) => (
                    <td key={c.key} className={"p-2 " + (c.className ?? "")}>
                      {href && c.key === columns[0].key ? (
                        <Link className="underline" href={href}>
                          {c.render(row)}
                        </Link>
                      ) : (
                        c.render(row)
                      )}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {pagination && (
        <div className="p-2 flex items-center justify-between text-xs bg-white">
          <div>
            {pagination.page} / {pagination.totalPages}（全{pagination.total}件）
          </div>
          <div className="flex gap-2">
            <PageLink disabled={pagination.page <= 1} page={pagination.page - 1} label="前へ" />
            <PageLink disabled={pagination.page >= pagination.totalPages} page={pagination.page + 1} label="次へ" />
          </div>
        </div>
      )}
    </div>
  );
}

function PageLink({ disabled, page, label }: { disabled: boolean; page: number; label: string }) {
  if (disabled) return <span className="text-gray-400">{label}</span>;
  // フィルタも維持したいので本来はqueryを維持するが、最小はpageのみ
  return (
    <Link className="underline" href={`?page=${page}`}>
      {label}
    </Link>
  );
}