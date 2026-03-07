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
  emptyMessage = "データがありません",
}: {
  columns: Column<T>[];
  rows: T[];
  pagination?: Pagination;
  makeHref?: (row: T) => string;
  emptyMessage?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={`border-b border-slate-200 px-3 py-2.5 text-left font-semibold text-slate-700 ${c.className ?? ""}`}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-3 py-8 text-center text-slate-500" colSpan={columns.length}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => {
                const href = makeHref?.(row);
                return (
                  <tr key={idx} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/80">
                    {columns.map((c) => (
                      <td key={c.key} className={`px-3 py-2.5 text-slate-700 ${c.className ?? ""}`}>
                        {href && c.key === columns[0].key ? (
                          <Link className="font-medium text-indigo-700 underline-offset-2 hover:underline" href={href}>
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
      </div>

      {pagination && (
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
          <div>
            {pagination.page} / {pagination.totalPages}（全{pagination.total}件）
          </div>
          <div className="flex gap-3">
            <PageLink disabled={pagination.page <= 1} page={pagination.page - 1} label="前へ" />
            <PageLink disabled={pagination.page >= pagination.totalPages} page={pagination.page + 1} label="次へ" />
          </div>
        </div>
      )}
    </div>
  );
}

function PageLink({ disabled, page, label }: { disabled: boolean; page: number; label: string }) {
  if (disabled) return <span className="text-slate-300">{label}</span>;
  return (
    <Link className="font-medium text-indigo-700 underline-offset-2 hover:underline" href={`?page=${page}`}>
      {label}
    </Link>
  );
}