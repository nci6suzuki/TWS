// src/app/(protected)/annual-events/page.tsx
import { requireAuth } from "@/lib/auth/require-auth";
import { getAnnualEvents } from "@/lib/queries/annual-events";
import { AnnualEventsTable } from "@/components/tables/annual-events-table";
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
    page: Number(searchParams.page ?? 1),
    limit: Number(searchParams.limit ?? 20),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">年間イベント一覧</h1>
        <Link href="/annual-events/new" className="px-4 py-2 rounded border bg-black text-white text-sm">
          新規登録
        </Link>
      </div>

      <AnnualEventsTable data={result.items} pagination={result.pagination} />
    </div>
  );
}