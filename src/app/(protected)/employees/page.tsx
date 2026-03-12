// src/app/(protected)/employees/page.tsx
import { requireAuth } from "@/lib/auth/require-auth";
import { getEmployees } from "@/lib/queries/employees";
import { EmployeesTable } from "@/components/tables/employees-table";
import { EmployeeFilters } from "@/components/filters/employee-filters";
import Link from "next/link";
import { Card, CardText, CardTitle } from "@/components/ui/card";

type EmployeesPageSearchParams = Promise<{
  branchId?: string | string[];
  departmentId?: string | string[];
  positionId?: string | string[];
  gradeId?: string | string[];
  keyword?: string | string[];
  page?: string | string[];
  limit?: string | string[];
  sort?: string | string[];
  order?: string | string[];
}>;

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: EmployeesPageSearchParams;
}) {
  const me = await requireAuth();
  const sp = await searchParams;

  const result = await getEmployees({
    me,
    branchId: typeof sp.branchId === "string" ? sp.branchId : undefined,
    departmentId:
      typeof sp.departmentId === "string" ? sp.departmentId : undefined,
    positionId: typeof sp.positionId === "string" ? sp.positionId : undefined,
    gradeId: typeof sp.gradeId === "string" ? sp.gradeId : undefined,
    keyword: typeof sp.keyword === "string" ? sp.keyword : undefined,
    page: Number(typeof sp.page === "string" ? sp.page : 1),
    limit: Number(typeof sp.limit === "string" ? sp.limit : 20),
    sort: typeof sp.sort === "string" ? sp.sort : "name",
    order:
      sp.order === "asc" || sp.order === "desc"
        ? sp.order
        : "asc",
  });

  return (
    <div className="space-y-5">
      <Card variant="elevated" style={{ padding: 0, overflow: "hidden" }}>
        <section className="flex flex-wrap items-end justify-between gap-3 bg-slate-50 p-6 sm:p-7">
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

      <EmployeeFilters me={me} initial={sp} />

      <EmployeesTable
        me={me}
        data={result.items.map((item: any) => ({
          ...item,
          followupStatus:
            item.followupStatus === "needs_followup"
              ? "needs_followup"
              : "normal",
        }))}
        pagination={result.pagination}
      />
    </div>
  );
}