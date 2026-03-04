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
      <Card variant="elevated" style={{ borderRadius: 26, padding: 24 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: "0.2em", color: "#6366f1" }}>DASHBOARD OVERVIEW</p>
        <h1 style={{ margin: "8px 0 0", fontSize: 30, color: "#0f172a" }}>ダッシュボード</h1>
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

      <section style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
        <InfoCard title="直近期限のフォロー">
          <ul style={listStyle}>
            {data.dueFollowups.length === 0 ? (
              <li style={{ color: "#64748b" }}>対象なし</li>
            ) : (
              data.dueFollowups.map((item) => (
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
              data.overdueFollowups.map((item) => (
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
        <InfoCard title="資格期限アラート">
          <ul style={listStyle}>
            {data.qualificationAlerts.length === 0 ? (
              <li style={{ color: "#64748b" }}>対象なし</li>
            ) : (
              data.qualificationAlerts.map((item) => (
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
              data.notifications.map((item) => (
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