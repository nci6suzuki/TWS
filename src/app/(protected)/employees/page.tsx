// src/app/(protected)/employees/page.tsx
import { requireAuth } from "@/lib/auth/require-auth";
import { getEmployees } from "@/lib/queries/employees";
import { EmployeesTable } from "@/components/tables/employees-table";
import { EmployeeFilters } from "@/components/filters/employee-filters";
import Link from "next/link";
import { Card, CardText, CardTitle } from "@/components/ui/card";

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
    <div className="space-y-5">
      <Card variant="elevated" style={{ padding: 0 }}>
        <section className="flex flex-wrap items-end justify-between gap-3 p-6 sm:p-7">
          <div>
            <CardTitle style={{ fontSize: 28 }}>社員一覧</CardTitle>
            <CardText style={{ marginTop: 10, fontSize: 14 }}>
              社員情報の閲覧、検索、アカウント招待を行えます。
            </CardText>
          </div>
          {(me.role === "admin" || me.role === "hr") && (
            <Link
              href="/employees/new"
              className="inline-flex h-11 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              + 社員登録
            </Link>
          )}
        </section>
      </Card>
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