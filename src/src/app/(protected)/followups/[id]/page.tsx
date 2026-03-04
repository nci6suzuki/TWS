// src/app/(protected)/followups/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { getFollowupById } from "@/lib/queries/followups";
import { FollowupCompleteButton } from "@/components/followups/followup-complete-button";

export default async function FollowupDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const me = await requireAuth();
  const followup = await getFollowupById({ me, id: params.id });

  if (!followup) return notFound();

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">フォロー割当 詳細</h1>
        <div className="flex gap-2">
          <Link className="underline text-sm" href={`/interviews/new?assignmentId=${followup.id}`}>
            面談記録を作成
          </Link>
          <Link className="underline text-sm" href={`/followups/${followup.id}/edit`}>
            編集
          </Link>
        </div>
      </div>

      <div className="border rounded p-4 space-y-2 text-sm">
        <Row label="年度" value={String(followup.fiscalYear)} />
        <Row label="四半期" value={`Q${followup.quarter}`} />
        <Row label="対象社員" value={followup.employeeName} />
        <Row label="種別" value={followup.followupType} />
        <Row label="担当者" value={followup.assigneeName} />
        <Row label="期限" value={followup.dueDate} />
        <Row label="優先度" value={priorityLabel(followup.priority)} />
        <Row label="状態" value={followup.status} />
        <Row label="備考" value={followup.note ?? "-"} />
      </div>

      <div className="flex gap-2">
        <FollowupCompleteButton followupId={followup.id} disabled={followup.status === "done"} />
        <Link className="px-4 py-2 rounded border text-sm" href="/followups">
          一覧へ戻る
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex border-b last:border-b-0 py-2">
      <div className="w-36 font-medium">{label}</div>
      <div className="flex-1">{value}</div>
    </div>
  );
}

function priorityLabel(v: number) {
  if (v === 1) return "高";
  if (v === 2) return "中";
  return "低";
}