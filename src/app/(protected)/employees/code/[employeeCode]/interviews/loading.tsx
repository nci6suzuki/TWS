// src/app/(protected)/employees/code/[employeeCode]/interviews/loading.tsx

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
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                <div className="mt-2 h-11 w-full animate-pulse rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-4">
            {[1, 2].map((i) => (
              <div key={i}>
                <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
                <div className="mt-2 h-24 w-full animate-pulse rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>

          <div className="mt-5 h-11 w-28 animate-pulse rounded-xl bg-slate-200" />
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded bg-slate-100" />
          </div>

          <div className="divide-y divide-slate-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />
                    <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-100" />
                    <div className="mt-4 h-16 w-full animate-pulse rounded-xl bg-slate-100" />
                  </div>

                  <div className="flex gap-2">
                    <div className="h-8 w-16 animate-pulse rounded-lg bg-slate-100" />
                    <div className="h-8 w-16 animate-pulse rounded-lg bg-rose-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}