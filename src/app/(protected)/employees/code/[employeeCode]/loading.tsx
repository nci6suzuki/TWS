// src/app/(protected)/employees/code/[employeeCode]/loading.tsx

import { PageShell } from "@/components/ui/page-shell";
import { Card } from "@/components/ui/ux";

export default function Loading() {
  return (
    <PageShell>
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
              <div className="mt-3 h-9 w-72 animate-pulse rounded bg-slate-200" />
              <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-slate-100" />

              <div className="mt-5 flex flex-wrap gap-2">
                <div className="h-7 w-20 animate-pulse rounded-full bg-slate-100" />
                <div className="h-7 w-24 animate-pulse rounded-full bg-slate-100" />
                <div className="h-7 w-28 animate-pulse rounded-full bg-slate-100" />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="h-11 w-24 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-11 w-24 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-5">
              <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
              <div className="mt-3 h-8 w-16 animate-pulse rounded bg-slate-100" />
            </Card>
          ))}
        </div>

        <Card className="p-5">
          <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-10 w-24 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />

              <div className="mt-5 space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-2xl bg-slate-100"
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />

              <div className="mt-5 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 animate-pulse rounded-2xl bg-slate-100"
                  />
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}