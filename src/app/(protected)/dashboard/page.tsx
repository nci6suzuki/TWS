// src/app/(protected)/dashboard/page.tsx
import Link from "next/link";
import { CSSProperties, ReactNode } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/require-auth";
import { getDashboardData } from "@/lib/queries/dashboard";

export default async function DashboardPage() {
  const me = await requireAuth();
  const data = await getDashboardData({ me });

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Card variant="elevated" style={{ borderRadius: 30, padding: 0, overflow: "hidden" }}>
        <div style={{ display: "grid", gap: 20, gridTemplateColumns: "minmax(0,1.5fr) minmax(320px,0.9fr)", padding: 28, background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 42%, #eef2ff 100%)" }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: "0.2em", color: "#6366f1" }}>TALENT MANAGEMENT HOME</p>
            <h1 style={{ margin: "10px 0 0", fontSize: 34, color: "#0f172a" }}>ダッシュボード</h1>
            <p style={{ margin: "14px 0 0", maxWidth: 720, fontSize: 14, lineHeight: 1.8, color: "#475569" }}>
              Kaonaviライクな「お知らせ」「ToDo」「主要機能導線」を取り込み、日々の利用開始地点として見やすいホーム画面に再構成しました。
            </p>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            <QuickPanel title="お知らせ" body={data.notifications[0]?.title ?? "現在のお知らせはありません。"} sub={data.notifications[0]?.body ?? "公開された通知はここに集約されます。"} />
            <QuickPanel title="ToDo" body={data.dueFollowups[0] ? `${data.dueFollowups[0].employeeName} / ${data.dueFollowups[0].followupType}` : "対応待ちのToDoはありません。"} sub={data.dueFollowups[0] ? `期限: ${data.dueFollowups[0].dueDate}` : "未完了のフォローや面談をここから確認できます。"} />
          </div>
        </div>
      </Card>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
        <KpiCard label="今月の面談件数" value={data.kpis.interviewCount} />
        <KpiCard label="未実施フォロー" value={data.kpis.pendingFollowupCount} />
        <KpiCard label="期限超過" value={data.kpis.overdueFollowupCount} />
        <KpiCard label="今週イベント" value={data.kpis.weekEventCount} />
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
        <KpiCard label="資格期限 30日以内" value={data.kpis.qualification30Count} />
        <KpiCard label="資格期限 90日以内" value={data.kpis.qualification90Count} />
        <KpiCard label="資格失効" value={data.kpis.qualificationExpiredCount} />
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
        <FeatureCard href="/employees" title="プロフィールブック" description="社員検索・カード表示・詳細閲覧" />
        <FeatureCard href="/annual-events" title="シートガレージ" description="年次イベント・進捗確認" />
        <FeatureCard href="/followups" title="スマートレビュー" description="フォロー対象・対応状況" />
        <FeatureCard href="/notifications" title="お知らせ" description="最新通知を一覧確認" />
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
        <InfoCard title="クイックアクション">
          <div style={{ display: "grid", gap: 10 }}>
            <ActionButton href="/employees/new" label="社員登録" description="新しい社員マスタを追加" />
            <ActionButton href="/interviews/new" label="面談記録を作成" description="面談の実施記録を登録" />
            <ActionButton href="/annual-events/new" label="イベント登録" description="年次イベントや研修を追加" />
            <ActionButton href="/followups" label="フォロー一覧を見る" description="未対応案件を確認" />
          </div>
        </InfoCard>

        <InfoCard title="直近期限のフォロー">
          <ul style={listStyle}>
            {data.dueFollowups.length === 0 ? (
              <li style={{ color: "#64748b" }}>対象なし</li>
            ) : (
              data.dueFollowups.map((item: any) => (
                <li key={item.id} style={itemStyle}>
                  <div style={{ fontWeight: 700, color: "#0f172a" }}>{item.employeeName}</div>
                  <div>種別：{item.followupType}</div>
                  <div>担当：{item.assigneeName}</div>
                  <div>期限：{item.dueDate}</div>
                  <Link style={linkStyle} href={`/followups/${item.id}`}>
                    詳細を見る
                  </Link>
                </li>
              ))
            )}
          </ul>
        </InfoCard>

        <InfoCard title="期限超過フォロー">
          <ul style={listStyle}>
            {data.overdueFollowups.length === 0 ? (
              <li style={{ color: "#64748b" }}>期限超過なし</li>
            ) : (
              data.overdueFollowups.map((item: any) => (
                <li key={item.id} style={{ ...itemStyle, border: "1px solid #fecaca", background: "#fff1f2" }}>
                  <div style={{ fontWeight: 700, color: "#be123c" }}>{item.employeeName}</div>
                  <div>種別：{item.followupType}</div>
                  <div>担当：{item.assigneeName}</div>
                  <div>期限：{item.dueDate}</div>
                  <Link style={{ ...linkStyle, color: "#be123c" }} href={`/followups/${item.id}`}>
                    詳細を見る
                  </Link>
                </li>
              ))
            )}
          </ul>
        </InfoCard>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
        <InfoCard title="今週の予定">
          <ul style={listStyle}>
            {data.weeklyEvents.length === 0 ? (
              <li style={{ color: "#64748b" }}>今週の予定はありません</li>
            ) : (
              data.weeklyEvents.map((item: any) => (
                <li key={item.id} style={itemStyle}>
                  <div style={{ fontWeight: 700, color: "#0f172a" }}>{item.title}</div>
                  <div>対象: {item.employeeName}</div>
                  <div>種別: {item.eventType}</div>
                  <div style={{ fontWeight: 700, color: "#1d4ed8" }}>日付: {item.scheduledDate}</div>
                </li>
              ))
            )}
          </ul>
        </InfoCard>

        <InfoCard title="資格期限アラート">
          <ul style={listStyle}>
            {data.qualificationAlerts.length === 0 ? (
              <li style={{ color: "#64748b" }}>対象なし</li>
            ) : (
              data.qualificationAlerts.map((item: any) => (
                <li key={item.id} style={itemStyle}>
                  <div style={{ fontWeight: 700, color: "#0f172a" }}>{item.employeeName}</div>
                  <div>資格：{item.qualificationName}</div>
                  <div style={{ fontWeight: 700, color: "#dc2626" }}>期限：{item.expiresOn}</div>
                  <div>状態：{item.status}</div>
                </li>
              ))
            )}
          </ul>
        </InfoCard>

        <InfoCard title="新着通知">
          <ul style={listStyle}>
            {data.notifications.length === 0 ? (
              <li style={{ color: "#64748b" }}>通知なし</li>
            ) : (
              data.notifications.map((item: any) => (
                <li key={item.id} style={itemStyle}>
                  <div style={{ fontWeight: 700, color: "#0f172a" }}>{item.title}</div>
                  <div style={{ color: "#475569" }}>{item.body}</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>{new Date(item.createdAt).toLocaleString()}</div>
                </li>
              ))
            )}
          </ul>
        </InfoCard>
      </section>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <Card style={{ borderRadius: 16, padding: 16 }}>
      <div style={{ fontSize: 13, color: "#64748b" }}>{label}</div>
      <div style={{ marginTop: 8, fontSize: 36, lineHeight: 1, fontWeight: 800, color: "#0f172a" }}>{value}</div>
    </Card>
  );
}

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card style={{ borderRadius: 16, padding: 16 }}>
      <CardTitle style={{ marginBottom: 10, fontSize: 16 }}>{title}</CardTitle>
      {children}
    </Card>
  );
}

const listStyle: CSSProperties = {
  display: "grid",
  gap: 8,
  listStyle: "none",
  margin: 0,
  padding: 0,
  fontSize: 14,
};

const itemStyle: CSSProperties = {
  borderRadius: 12,
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  padding: 12,
};

const linkStyle: CSSProperties = {
  marginTop: 3,
  display: "inline-block",
  color: "#4f46e5",
  fontSize: 12,
  fontWeight: 700,
};

function QuickPanel({ title, body, sub }: { title: string; body: string; sub: string }) {
  return (
    <div style={{ borderRadius: 22, border: "1px solid #e2e8f0", background: "rgba(255,255,255,0.92)", padding: 18, minHeight: 120 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: "#334155" }}>{title}</div>
      <div style={{ marginTop: 12, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{body}</div>
      <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.6, color: "#64748b" }}>{sub}</div>
    </div>
  );
}

function FeatureCard({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <Card style={{ borderRadius: 18, padding: 18, height: "100%" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{title}</div>
        <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.6, color: "#64748b" }}>{description}</div>
        <div style={{ marginTop: 14, fontSize: 12, fontWeight: 700, color: "#4f46e5" }}>開く →</div>
      </Card>
    </Link>
  );
}


function ActionButton({ href, label, description }: { href: string; label: string; description: string }) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div style={{ borderRadius: 14, border: "1px solid #cbd5e1", background: "#fff", padding: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{label}</div>
        <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>{description}</div>
      </div>
    </Link>
  );
}