// src/app/(protected)/employees/page.tsx
import { requireAuth } from "@/lib/auth/require-auth";
import { getEmployees } from "@/lib/queries/employees";
import { EmployeesTable } from "@/components/tables/employees-table";
import { EmployeeFilters } from "@/components/filters/employee-filters";
import Link from "next/link";

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const me = await requireAuth();

  const result = await getEmployees({
    me,
    branchId: typeof searchParams.branchId === "string" ? searchParams.branchId : undefined,
    departmentId: typeof searchParams.departmentId === "string" ? searchParams.departmentId : undefined,
    positionId: typeof searchParams.positionId === "string" ? searchParams.positionId : undefined,
    gradeId: typeof searchParams.gradeId === "string" ? searchParams.gradeId : undefined,
    keyword: typeof searchParams.keyword === "string" ? searchParams.keyword : undefined,
    page: Number(searchParams.page ?? 1),
    limit: Number(searchParams.limit ?? 20),
    sort: typeof searchParams.sort === "string" ? searchParams.sort : "name",
    order:
      searchParams.order === "asc" || searchParams.order === "desc"
        ? searchParams.order
        : "asc",
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">社員一覧</h1>
        {(me.role === "admin" || me.role === "hr") && (
          <Link
            href="/employees/new"
            className="px-4 py-2 rounded border bg-black text-white text-sm"
          >
            社員登録
          </Link>
        )}
      </div>
      <EmployeeFilters me={me} initial={searchParams} />
      <EmployeesTable
        me={me}
          data={result.items.map((item: any) => ({
            ...item,
            followupStatus:
            item.followupStatus === "needs_followup" ? "needs_followup" : "normal",
          }))}
        pagination={result.pagination}
      />
    </div>
  );
}