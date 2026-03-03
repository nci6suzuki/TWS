// src/app/(protected)/annual-events/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { getAnnualEventById } from "@/lib/queries/annual-events";
import { AnnualEventCompleteButton } from "@/components/annual-events/annual-event-complete-button";

export default async function AnnualEventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const me = await requireAuth();
  const event = await getAnnualEventById({ me, id: params.id });

  if (!event) return notFound();

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">年間イベント 詳細</h1>
        <div className="flex gap-2">
          <Link className="underline text-sm" href={`/annual-events/${event.id}/edit`}>
            編集
          </Link>
        </div>
      </div>

      <div className="border rounded p-4 space-y-2 text-sm">
        <Row label="対象社員" value={event.employeeName} />
        <Row label="タイトル" value={event.title} />
        <Row label="種別" value={event.eventType} />
        <Row label="予定日" value={event.scheduledDate} />
        <Row label="担当者" value={event.ownerName} />
        <Row label="優先度" value={priorityLabel(event.priority)} />
        <Row label="状態" value={event.status} />
        <Row label="説明" value={event.description || "-"} />
      </div>

      <div className="flex gap-2">
        <AnnualEventCompleteButton eventId={event.id} disabled={event.status === "done"} />
        <Link className="px-4 py-2 rounded border text-sm" href="/annual-events">
          一覧へ戻る
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex border-b last:border-b-0 py-2">
      <div className="w-32 font-medium">{label}</div>
      <div className="flex-1">{value}</div>
    </div>
  );
}

function priorityLabel(v: number) {
  if (v === 1) return "高";
  if (v === 2) return "中";
  return "低";
}