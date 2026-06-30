// src/app/(protected)/organization/loading.tsx

import { PageShell } from "@/components/ui/page-shell";
import { Card } from "@/components/ui/ux";

export default function Loading() {
  return (
    <PageShell>
      <div className="space-y-6">
        <Card className="p-6">
          <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-4 w-96 animate-pulse rounded bg-slate-100" />
        </Card>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-5">
              <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
              <div className="mt-3 h-8 w-16 animate-pulse rounded bg-slate-100" />
            </Card>
          ))}
        </div>

        <Card className="p-6">
          <div className="h-[420px] animate-pulse rounded-2xl bg-slate-100" />
        </Card>
      </div>
    </PageShell>
  );
}