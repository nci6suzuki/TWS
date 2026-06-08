import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseServerDbClient } from "@/lib/supabase/server-db";

export default async function AnnualEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;

  const supabase = await createSupabaseServerDbClient();

  const { data: event, error } = await supabase
    .from("employee_annual_events")
    .select("id, employee_id, title, event_type, scheduled_date, owner_employee_id, priority, status, description")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!event) return notFound();

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-6 flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold">年間イベント 詳細</div>
          <div className="mt-2 text-sm text-slate-600">{event.title}</div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/annual-events/${event.id}/edit`}
            className="inline-flex h-10 items-center rounded-xl border bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            編集
          </Link>
          <CompleteButton eventId={event.id} disabled={event.status === "done"} />
          <Link
            href="/annual-events"
            className="inline-flex h-10 items-center rounded-xl border bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            一覧へ
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6">
        <Row label="予定日" value={String(event.scheduled_date)} />
        <Row label="種別" value={event.event_type} />
        <Row label="状態" value={event.status} />
        <Row label="優先度" value={String(event.priority)} />
        <Row label="説明" value={event.description || "-"} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-3 border-b last:border-b-0 py-3">
      <div className="text-sm font-semibold text-slate-600">{label}</div>
      <div className="text-sm text-slate-900 whitespace-pre-wrap">{value}</div>
    </div>
  );
}

/** 完了化ボタン（client） */
function CompleteButton({ eventId, disabled }: { eventId: string; disabled: boolean }) {
  // NextのServer Component内なので、簡易に form action で実装
  return (
    <form action={`/api/annual-events/${eventId}/complete`} method="post">
      <button
        disabled={disabled}
        className={[
          "inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold text-white",
          disabled ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:bg-slate-800",
        ].join(" ")}
      >
        完了化
      </button>
    </form>
  );
}