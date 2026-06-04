// src/app/(protected)/employees/page.tsx
import { requireAuth } from "@/lib/auth/require-auth";
import { getEmployees } from "@/lib/queries/employees";
import { EmployeeDirectory } from "@/components/employees/employee-directory";
import { EmployeeFilters } from "@/components/filters/employee-filters";
import Link from "next/link";
import { Card, CardText, CardTitle } from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/layout/v2/page";

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
  status?: string | string[];
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
    status: typeof sp.status === "string" ? (sp.status as "active" | "inactive" | "leave") : undefined,
    page: Number(typeof sp.page === "string" ? sp.page : 1),
    limit: Number(typeof sp.limit === "string" ? sp.limit : 20),
    sort: typeof sp.sort === "string" ? sp.sort : "name",
    order:
      sp.order === "asc" || sp.order === "desc"
        ? sp.order
        : "asc",
  });

  return (
    <PageContainer size="xl">
    <div className="space-y-6">
      <PageHeader
        title="社員一覧"
        description="検索・絞り込み・表示切替で社員カルテへ素早くアクセスできます。"
        actions={
          (me.role === "admin" || me.role === "hr") ? (
            <Link
              href="/employees/new"
              className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
            >
              + 社員登録
            </Link>
          ) : null
        }
      />

      <EmployeeFilters me={me} initial={sp} />

      <EmployeeDirectory
        me={me}
        employees={result.items.map((item: any) => ({
          ...item,
          followupStatus:
            item.followupStatus === "needs_followup"
              ? "needs_followup"
              : "normal",
        }))}
        pagination={result.pagination}
      />
    </div>
    </PageContainer>
  );
}