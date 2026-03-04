import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { getAuditLogs } from "@/lib/queries/audit-logs";
import { AuditLogFilters } from "@/components/filters/audit-log-filters";
import { AuditLogsTable } from "@/components/tables/audit-logs-table";

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const me = await requireAuth();

  if (!["admin", "hr"].includes(me.role)) {
    redirect("/unauthorized");
  }

  const result = await getAuditLogs({
    me,
    tableName: searchParams.tableName,
    action: (searchParams.action as "INSERT" | "UPDATE" | "DELETE" | undefined) ?? undefined,
    page: Number(searchParams.page ?? 1),
    limit: Number(searchParams.limit ?? 20),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">監査ログ</h1>
      <AuditLogFilters />
      <AuditLogsTable data={result.items} pagination={result.pagination} />
    </div>
  );
}