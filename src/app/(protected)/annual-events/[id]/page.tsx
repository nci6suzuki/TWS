import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseServerDbClient } from "@/lib/supabase/server-db";
import { PageShell } from "@/components/ui/page-shell";
import { Hero, Card, Chip, GhostButton } from "@/components/ui/ux";

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
    .select(
      "id, employee_id, title, event_type, scheduled_date, owner_employee_id, priority, status, description"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!event) return notFound();

  const today = new Date().toISOString().slice(0, 10);
  const isOverdue =
    event.status === "pending" && String(event.scheduled_date) < today;

  return (
    <PageShell>
      <Hero
        title="年間イベント 詳細"
        subtitle="イベント内容の確認、編集、完了化をこの画面から行います。"
        meta={
          <div className="flex flex-wrap gap-2">
            <Chip tone={event.status === "done" ? "ok" : isOverdue ? "danger" : "gray"}>
              状態: {isOverdue ? "期限超過" : event.status}
            </Chip>
            <Chip tone="info">種別: {event.event_type}</Chip>
            <Chip>予定日: {String(event.scheduled_date)}</Chip>
            <Chip>優先度: {event.priority}</Chip>
          </div>
        }
        right={
          <>
            <GhostButton href="/annual-events">一覧へ戻る</GhostButton>
            <GhostButton href={`/annual-events/${event.id}/edit`}>
              編集
            </GhostButton>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4 md:px-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  イベント情報
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  予定・状態・説明を確認できます。
                </p>
              </div>

              <Chip tone={event.status === "done" ? "ok" : isOverdue ? "danger" : "gray"}>
                {event.status === "done"
                  ? "完了"
                  : isOverdue
                    ? "期限超過"
                    : "未完了"}
              </Chip>
            </div>
          </div>

          <div className="p-5 md:p-6">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Title
              </div>
              <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                {event.title}
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-500">
                イベントID: {event.id}
              </p>
            </div>

            <div className="mt-5 divide-y divide-slate-100 rounded-3xl border border-slate-200 bg-white">
              <Row label="タイトル" value={event.title} />
              <Row label="予定日" value={String(event.scheduled_date)} />
              <Row label="種別" value={event.event_type} />
              <Row label="状態" value={event.status} />
              <Row label="優先度" value={String(event.priority)} />
              <Row label="社員ID" value={event.employee_id ?? "-"} />
              <Row label="担当者ID" value={event.owner_employee_id ?? "-"} />
            </div>

            <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5">
              <div className="text-sm font-black text-slate-900">説明</div>
              <div className="mt-3 whitespace-pre-wrap text-sm font-medium leading-7 text-slate-600">
                {event.description || "説明は登録されていません。"}
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  クイック操作
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  よく使う操作をまとめています。
                </p>
              </div>
              <Chip tone="gray">Quick</Chip>
            </div>

            <div className="mt-5 grid gap-3">
              <Link
                href={`/annual-events/${event.id}/edit`}
                className="group rounded-2xl border border-slate-200 bg-white p-4 text-sm font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span>編集する</span>
                  <span className="rounded-xl bg-slate-100 px-2 py-1 text-xs transition group-hover:bg-slate-900 group-hover:text-white">
                    →
                  </span>
                </div>
              </Link>

              <form action={`/api/annual-events/${event.id}/complete`} method="post">
                <button
                  disabled={event.status === "done"}
                  className={[
                    "w-full rounded-2xl px-4 py-4 text-left text-sm font-black shadow-sm transition",
                    event.status === "done"
                      ? "cursor-not-allowed bg-slate-200 text-slate-500"
                      : "bg-slate-900 text-white hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md",
                  ].join(" ")}
                >
                  完了化する
                </button>
              </form>

              <Link
                href="/annual-events"
                className="group rounded-2xl border border-slate-200 bg-white p-4 text-sm font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span>一覧へ戻る</span>
                  <span className="rounded-xl bg-slate-100 px-2 py-1 text-xs transition group-hover:bg-slate-900 group-hover:text-white">
                    →
                  </span>
                </div>
              </Link>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  対応状況
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  現在のイベント状態です。
                </p>
              </div>
              <Chip
                tone={
                  event.status === "done"
                    ? "ok"
                    : isOverdue
                      ? "danger"
                      : "gray"
                }
              >
                {event.status}
              </Chip>
            </div>

            <div
              className={[
                "mt-5 rounded-3xl border p-5",
                event.status === "done"
                  ? "border-emerald-200 bg-emerald-50"
                  : isOverdue
                    ? "border-rose-200 bg-rose-50"
                    : "border-slate-200 bg-slate-50",
              ].join(" ")}
            >
              <div
                className={[
                  "text-sm font-black",
                  event.status === "done"
                    ? "text-emerald-700"
                    : isOverdue
                      ? "text-rose-700"
                      : "text-slate-800",
                ].join(" ")}
              >
                {event.status === "done"
                  ? "このイベントは完了済みです。"
                  : isOverdue
                    ? "このイベントは期限を過ぎています。"
                    : "このイベントは未完了です。"}
              </div>

              <p
                className={[
                  "mt-2 text-sm font-medium leading-6",
                  event.status === "done"
                    ? "text-emerald-600"
                    : isOverdue
                      ? "text-rose-600"
                      : "text-slate-500",
                ].join(" ")}
              >
                {event.status === "done"
                  ? "必要に応じて内容を確認してください。"
                  : isOverdue
                    ? "優先的に確認し、対応済みであれば完了化してください。"
                    : "対応が完了したら、完了化ボタンを押してください。"}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 gap-1 px-5 py-4 md:grid-cols-[160px_1fr] md:gap-4">
      <div className="text-sm font-black text-slate-500">{label}</div>
      <div className="whitespace-pre-wrap text-sm font-semibold text-slate-900">
        {value}
      </div>
    </div>
  );
}