// src/app/(protected)/dashboard/page.tsx
import Link from "next/link";
import { ReactNode } from "react";
import { requireAuth } from "@/lib/auth/require-auth";
import { getDashboardData } from "@/lib/queries/dashboard";
import { PageContainer, PageHeader, PageSection } from "@/components/layout/v2/page";

export default async function DashboardPage() {
  const me = await requireAuth();
  const data = await getDashboardData({ me });

  return (
    <PageContainer size="xl">
      <div className="space-y-6">
        <PageHeader
          title="ダッシュボード"
          description="直近の予定・期限・要対応をまとめて確認できます。"
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
          {/* Left */}
          <div className="space-y-6">
            <PageSection title="KPI / 状況" description="今月・今週の主要指標">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <KpiCard label="今月の面談件数" value={data.kpis.interviewCount} />
                <KpiCard label="未実施フォロー" value={data.kpis.pendingFollowupCount} />
                <KpiCard label="期限超過" value={data.kpis.overdueFollowupCount} />
                <KpiCard label="今週イベント" value={data.kpis.weekEventCount} />
              </div>
            </PageSection>

            <PageSection title="メニュー" description="主要画面へのショートカット">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <FeatureCard href="/employees" title="プロフィールブック" description="社員検索・カード表示・詳細閲覧" />
                <FeatureCard href="/annual-events" title="シートガレージ" description="年次イベント・進捗確認" />
                <FeatureCard href="/followups" title="スマートレビュー" description="フォロー対象・対応状況" />
                <FeatureCard href="/notifications" title="お知らせ" description="最新通知を一覧確認" />
              </div>
            </PageSection>
          </div>

          {/* Right */}
          <div className="space-y-6">
            <PageSection title="アラート" description="資格期限・失効の状況">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <KpiCard label="資格期限 30日以内" value={data.kpis.qualification30Count} />
                <KpiCard label="資格期限 90日以内" value={data.kpis.qualification90Count} />
                <KpiCard label="資格失効" value={data.kpis.qualificationExpiredCount} />
              </div>
            </PageSection>

            <PageSection title="クイックアクション" description="よく使う操作">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoCard title="アクション">
                  <div className="grid gap-2">
                    <ActionButton href="/employees/new" label="社員登録" description="新しい社員マスタを追加" />
                    <ActionButton href="/interviews/new" label="面談記録を作成" description="面談の実施記録を登録" />
                    <ActionButton href="/annual-events/new" label="イベント登録" description="年次イベントや研修を追加" />
                    <ActionButton href="/followups" label="フォロー一覧を見る" description="未対応案件を確認" />
                  </div>
                </InfoCard>

                <InfoCard title="直近期限のフォロー">
                  <ul className="grid gap-2 text-sm">
                    {data.dueFollowups.length === 0 ? (
                      <li className="text-slate-500">対象なし</li>
                    ) : (
                      data.dueFollowups.map((item: any) => (
                        <li
                          key={item.id}
                          className="rounded-xl border bg-slate-50 p-3"
                        >
                          <div className="font-semibold text-slate-900">{item.employeeName}</div>
                          <div className="mt-1 text-slate-600">種別：{item.followupType}</div>
                          <div className="text-slate-600">担当：{item.assigneeName}</div>
                          <div className="text-slate-600">期限：{item.dueDate}</div>
                          <Link className="mt-2 inline-block text-xs font-semibold text-indigo-600 hover:underline" href={`/followups/${item.id}`}>
                            詳細を見る →
                          </Link>
                        </li>
                      ))
                    )}
                  </ul>
                </InfoCard>

                <InfoCard title="期限超過フォロー">
                  <ul className="grid gap-2 text-sm">
                    {data.overdueFollowups.length === 0 ? (
                      <li className="text-slate-500">期限超過なし</li>
                    ) : (
                      data.overdueFollowups.map((item: any) => (
                        <li
                          key={item.id}
                          className="rounded-xl border border-rose-200 bg-rose-50 p-3"
                        >
                          <div className="font-semibold text-rose-700">{item.employeeName}</div>
                          <div className="mt-1 text-rose-700/90">種別：{item.followupType}</div>
                          <div className="text-rose-700/90">担当：{item.assigneeName}</div>
                          <div className="text-rose-700/90">期限：{item.dueDate}</div>
                          <Link className="mt-2 inline-block text-xs font-semibold text-rose-700 hover:underline" href={`/followups/${item.id}`}>
                            詳細を見る →
                          </Link>
                        </li>
                      ))
                    )}
                  </ul>
                </InfoCard>
              </div>
            </PageSection>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-xs font-semibold tracking-[0.12em] text-slate-400">{label}</div>
      <div className="mt-2 text-3xl font-extrabold leading-none text-slate-900">{value}</div>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function FeatureCard({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link href={href} className="rounded-2xl border bg-white p-4 hover:bg-slate-50 transition">
      <div className="text-base font-bold text-slate-900">{title}</div>
      <div className="mt-2 text-sm text-slate-600 leading-relaxed">{description}</div>
      <div className="mt-3 text-xs font-semibold text-indigo-600">開く →</div>
    </Link>
  );
}

function ActionButton({ href, label, description }: { href: string; label: string; description: string }) {
  return (
    <Link href={href} className="rounded-2xl border bg-white p-3 hover:bg-slate-50 transition">
      <div className="text-sm font-bold text-slate-900">{label}</div>
      <div className="mt-1 text-xs text-slate-600">{description}</div>
    </Link>
  );
}