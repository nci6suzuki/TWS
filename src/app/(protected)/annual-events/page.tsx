// src/app/(protected)/annual-events/page.tsx
import { requireAuth } from "@/lib/auth/require-auth";
import { getAnnualEvents } from "@/lib/queries/annual-events";
import { AnnualEventsTable } from "@/components/tables/annual-events-table";
import { AnnualEventFilters } from "@/components/filters/annual-event-filters";
import { PageContainer, PageHeader } from "@/components/layout/v2/page";
import Link from "next/link";

export default async function AnnualEventsPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const me = await requireAuth();

  const result = await getAnnualEvents({
    me,
    employeeId: searchParams.employeeId,
    fiscalYear: searchParams.fiscalYear ? Number(searchParams.fiscalYear) : undefined,
    eventType: searchParams.eventType,
    status: searchParams.status,
    keyword: searchParams.keyword,
    page: Number(searchParams.page ?? 1),
    limit: Number(searchParams.limit ?? 20),
  });

  return (
    <PageContainer size="xl">
      <div className="space-y-6">
        <PageHeader
          title="年間イベント"
          description="研修・面談・評価などの予定を管理します。"
          actions={
            <div className="flex gap-2">
              <Link
                href="/annual-events/new"
                className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
              >
                + イベント登録
              </Link>
            </div>
          }
        />

        {/* ★ initial/me を渡してURLとUIを同期 */}
        <AnnualEventFilters me={me} initial={searchParams} />

        <AnnualEventsTable data={result.items} pagination={result.pagination} />
      </div>
    </PageContainer>
  );
}