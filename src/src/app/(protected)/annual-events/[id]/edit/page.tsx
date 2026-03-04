// src/app/(protected)/annual-events/[id]/edit/page.tsx
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { getAnnualEventById } from "@/lib/queries/annual-events";
import { AnnualEventEditForm } from "@/components/forms/annual-event-edit-form";

export default async function AnnualEventEditPage({
  params,
}: {
  params: { id: string };
}) {
  const me = await requireAuth();
  const event = await getAnnualEventById({ me, id: params.id });

  if (!event) return notFound();

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-xl font-semibold">年間イベント 編集</h1>
      <AnnualEventEditForm me={me} initialData={event} />
    </div>
  );
}