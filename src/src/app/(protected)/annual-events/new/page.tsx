// src/app/(protected)/annual-events/new/page.tsx
import { requireAuth } from "@/lib/auth/require-auth";
import { AnnualEventForm } from "@/components/forms/annual-event-form";

export default async function AnnualEventNewPage() {
  const me = await requireAuth();

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-xl font-semibold">年間イベント登録</h1>
      <AnnualEventForm me={me} />
    </div>
  );
}