// src/app/(protected)/employees/page.tsx
import { requireAuth } from "@/lib/auth/require-auth";
import { getEmployees } from "@/lib/queries/employees";
import { EmployeeDirectory } from "@/components/employees/employee-directory";
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
        <section className="flex flex-wrap items-end justify-between gap-4 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_45%,#eef2ff_100%)] p-6 sm:p-8">
          <div className="max-w-3xl">
            <div className="text-sm font-bold tracking-[0.18em] text-indigo-600">PROFILE BOOK</div>
            <CardTitle style={{ marginTop: 10, fontSize: 32 }}>社員一覧</CardTitle>
            <CardText style={{ marginTop: 12, fontSize: 14, lineHeight: 1.8 }}>
              添付イメージのように一覧性を高めるため、検索 → 表示切替 → 詳細導線を1画面に整理しました。カード表示/リスト表示を切り替えながら、プロフィールブック感覚で社員情報を確認できます。
            </CardText>
          </div>
          {(me.role === "admin" || me.role === "hr") && (
            <Link
              href="/employees/new"
              className="inline-flex h-12 items-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              + 社員登録
            </Link>
          )}
        </section>
      </Card>

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
  );
}