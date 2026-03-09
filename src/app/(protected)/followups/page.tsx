// src/app/(protected)/followups/page.tsx
import { requireAuth } from "@/lib/auth/require-auth";
import { getFollowups } from "@/lib/queries/followups";
import { FollowupsTable } from "@/components/tables/followups-table";

export default async function FollowupsPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const me = await requireAuth();

  const result = await getFollowups({
    me,
    fiscalYear: searchParams.fiscalYear ? Number(searchParams.fiscalYear) : undefined,
    quarter: searchParams.quarter ? (Number(searchParams.quarter) as 1 | 2 | 3 | 4) : undefined,
    status: searchParams.status,
    assigneeEmployeeId: searchParams.assigneeEmployeeId,
    employeeId: searchParams.employeeId,
    branchId: searchParams.branchId,
    page: Number(searchParams.page ?? 1),
    limit: Number(searchParams.limit ?? 20),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">フォロー割当一覧</h1>
      <FollowupsTable me={me} data={result.items} pagination={result.pagination} />
    </div>
  );
}