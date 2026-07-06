// src/app/(protected)/employees/code/[employeeCode]/edit/loading.tsx

import { PageShell } from "@/components/ui/page-shell";
import { Card } from "@/components/ui/ux";

export default function Loading() {
  return (
    <PageShell>
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="h-4 w-36 animate-pulse rounded bg-slate-200" />
              <div className="mt-3 h-9 w-72 animate-pulse rounded bg-slate-200" />
              <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-slate-100" />
            </div>

            <div className="h-11 w-24 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        </Card>

        <Card className="p-5">
          <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded bg-slate-100" />

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i}>
                <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                <div className="mt-2 h-11 w-full animate-pulse rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="h-6 w-44 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded bg-slate-100" />

          <div className="mt-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
                <div className="mt-2 h-24 w-full animate-pulse rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <div className="h-11 w-24 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-11 w-28 animate-pulse rounded-xl bg-slate-200" />
        </div>
      </div>
    </PageShell>
  );
}