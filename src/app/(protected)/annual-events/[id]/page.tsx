import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseServerDbClient } from "@/lib/supabase/server-db";
import { PageContainer, PageHeader, Section } from "@/components/ui/page";
import { Badge } from "@/components/ui/stat";

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

  const meta = (
    <div className="flex flex-wrap gap-2">
      <Badge>状態: {event.status}</Badge>
      <Badge>種別: {event.event_type}</Badge>
      {event.status === "pending" ? <Badge>未完了</Badge> : null}
      {event.status === "done" ? <Badge tone="ok">完了</Badge> : null}
    </div>
  );

  return (
    <PageContainer>
      <PageHeader
        title="年間イベント 詳細"
        description="内容確認・編集・完了化をこの画面から行います。"
        meta={meta}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/annual-events/${event.id}/edit`}
              className="inline-flex h-10 items-center rounded-xl border bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              編集
            </Link>

            <form action={`/api/annual-events/${event.id}/complete`} method="post">
              <button
                disabled={event.status === "done"}
                className={[
                  "inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold text-white",
                  event.status === "done"
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-slate-900 hover:bg-slate-800",
                ].join(" ")}
              >
                完了化
              </button>
            </form>

            <Link
              href="/annual-events"
              className="inline-flex h-10 items-center rounded-xl border bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              一覧へ
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <Section title="イベント情報" description="予定・状態・説明を確認します。">
          <Row label="タイトル" value={event.title} />
          <Row label="予定日" value={String(event.scheduled_date)} />
          <Row label="種別" value={event.event_type} />
          <Row label="状態" value={event.status} />
          <Row label="優先度" value={String(event.priority)} />
          <Row label="説明" value={event.description || "-"} />
        </Section>

        <Section title="クイック" description="よく使う操作">
          <div className="grid gap-2">
            <Link
              href={`/annual-events/${event.id}/edit`}
              className="rounded-xl border bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              編集する
            </Link>
            <form action={`/api/annual-events/${event.id}/complete`} method="post">
              <button
                disabled={event.status === "done"}
                className={[
                  "w-full rounded-xl px-4 py-3 text-sm font-semibold text-white",
                  event.status === "done"
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-slate-900 hover:bg-slate-800",
                ].join(" ")}
              >
                完了化する
              </button>
            </form>
            <Link
              href="/annual-events"
              className="rounded-xl border bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              一覧へ戻る
            </Link>
          </div>
        </Section>
      </div>
    </PageContainer>
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