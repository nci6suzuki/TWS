// src/app/(protected)/organization/loading.tsx

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
              <div className="mt-3 h-8 w-72 animate-pulse rounded bg-slate-200" />
              <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-slate-100" />
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="h-10 w-24 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-10 w-24 animate-pulse rounded-xl bg-slate-100" />
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
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
              <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded bg-slate-100" />
            </div>

            <div className="flex gap-2">
              <div className="h-9 w-28 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-9 w-20 animate-pulse rounded-xl bg-slate-100" />
            </div>
          </div>

          <div className="mt-6 overflow-hidden">
            <div className="flex min-w-[900px] items-start gap-8">
              <SkeletonNode />

              <div className="space-y-5">
                <SkeletonNode />
                <SkeletonNode />
              </div>

              <div className="space-y-5">
                <SkeletonNode />
                <SkeletonNode />
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className="p-5">
            <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-100" />

            <div className="mt-5 space-y-4">
              <div className="h-11 w-full animate-pulse rounded-xl bg-slate-100" />
              <div className="h-11 w-full animate-pulse rounded-xl bg-slate-100" />
              <div className="h-11 w-32 animate-pulse rounded-xl bg-slate-200" />
            </div>
          </Card>

          <Card className="p-5">
            <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-100" />

            <div className="mt-5 space-y-4">
              <div className="h-11 w-full animate-pulse rounded-xl bg-slate-100" />
              <div className="h-11 w-full animate-pulse rounded-xl bg-slate-100" />
              <div className="h-11 w-32 animate-pulse rounded-xl bg-indigo-100" />
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

function SkeletonNode() {
  return (
    <div className="w-[370px] border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 animate-pulse rounded bg-slate-100" />

        <div className="min-w-0 flex-1">
          <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 flex gap-2">
            <div className="h-5 w-14 animate-pulse rounded-full bg-slate-100" />
            <div className="h-5 w-14 animate-pulse rounded-full bg-slate-100" />
            <div className="h-5 w-14 animate-pulse rounded-full bg-slate-100" />
          </div>
        </div>

        <div className="h-8 w-8 animate-pulse rounded bg-slate-100" />
      </div>

      <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
        <div className="h-9 w-full animate-pulse rounded-xl bg-slate-50" />
        <div className="h-9 w-full animate-pulse rounded-xl bg-slate-50" />
        <div className="h-9 w-full animate-pulse rounded-xl bg-slate-50" />
      </div>
    </div>
  );
}