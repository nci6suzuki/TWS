"use client";

import { useMemo, useState } from "react";
import { Pagination } from "@/types/api";

type AuditLogItem = {
  id: string;
  tableName: string;
  action: string;
  recordId: string;
  actorEmployeeId: string;
  actorName: string;
  actorEmployeeCode: string;
  oldData: any;
  newData: any;
  createdAt: string;
};

type DiffRow = {
  key: string;
  oldValue: string;
  newValue: string;
};

function toDisplayValue(value: unknown) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function buildDiffRows(oldData: any, newData: any): DiffRow[] {
  const oldObj = oldData ?? {};
  const newObj = newData ?? {};
  const keys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]));

  return keys
    .map((key) => {
      const oldValue = oldObj[key];
      const newValue = newObj[key];
      const same = JSON.stringify(oldValue) === JSON.stringify(newValue);

      return same
        ? null
        : {
            key,
            oldValue: toDisplayValue(oldValue),
            newValue: toDisplayValue(newValue),
          };
    })
    .filter(Boolean) as DiffRow[];
}

export function AuditLogsTable({
  data,
  pagination,
}: {
  data: AuditLogItem[];
  pagination: Pagination;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="border rounded">
        {data.length === 0 ? (
          <div className="p-4 text-sm text-gray-600">監査ログはありません。</div>
        ) : (
          <ul>
            {data.map((row) => {
              const open = openId === row.id;
              const diffRows = buildDiffRows(row.oldData, row.newData);

              return (
                <li key={row.id} className="p-4 border-b last:border-b-0 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-2 text-sm">
                    <div>
                      <div className="text-gray-500">日時</div>
                      <div>{new Date(row.createdAt).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">テーブル</div>
                      <div>{row.tableName}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">操作</div>
                      <div>{row.action}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">レコードID</div>
                      <div className="break-all">{row.recordId}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">実行者</div>
                      <div>
                        {row.actorName || "-"}
                        {row.actorEmployeeCode ? `（${row.actorEmployeeCode}）` : ""}
                      </div>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => setOpenId(open ? null : row.id)}
                        className="text-sm underline"
                      >
                        {open ? "詳細を閉じる" : "詳細を見る"}
                      </button>
                    </div>
                  </div>

                  {open && (
                    <div className="space-y-3">
                      <div className="border rounded">
                        <div className="p-3 font-medium text-sm border-b">変更差分</div>
                        {diffRows.length === 0 ? (
                          <div className="p-3 text-sm text-gray-600">差分はありません。</div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b bg-gray-50">
                                  <th className="text-left p-2">項目</th>
                                  <th className="text-left p-2">変更前</th>
                                  <th className="text-left p-2">変更後</th>
                                </tr>
                              </thead>
                              <tbody>
                                {diffRows.map((diff) => (
                                  <tr key={diff.key} className="border-b last:border-b-0 align-top">
                                    <td className="p-2 font-medium">{diff.key}</td>
                                    <td className="p-2 whitespace-pre-wrap break-all">{diff.oldValue}</td>
                                    <td className="p-2 whitespace-pre-wrap break-all">{diff.newValue}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      <details className="border rounded p-3">
                        <summary className="cursor-pointer text-sm font-medium">JSONをそのまま見る</summary>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
                          <pre className="text-xs whitespace-pre-wrap break-all border rounded p-3">
                            {JSON.stringify(row.oldData, null, 2) || "null"}
                          </pre>
                          <pre className="text-xs whitespace-pre-wrap break-all border rounded p-3">
                            {JSON.stringify(row.newData, null, 2) || "null"}
                          </pre>
                        </div>
                      </details>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="text-sm text-gray-600">
        {pagination.page} / {pagination.totalPages} ページ（全 {pagination.total} 件）
      </div>
    </div>
  );
}