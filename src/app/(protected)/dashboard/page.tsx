// src/app/(protected)/dashboard/page.tsx
import Link from "next/link";
import { requireAuth } from "@/lib/auth/require-auth";
import { getDashboardData } from "@/lib/queries/dashboard";

export default async function DashboardPage() {
  const me = await requireAuth();
  const data = await getDashboardData({ me });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">ダッシュボード</h1>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label="今月の面談件数" value={data.kpis.interviewCount} />
        <KpiCard label="未実施フォロー" value={data.kpis.pendingFollowupCount} />
        <KpiCard label="期限超過" value={data.kpis.overdueFollowupCount} />
        <KpiCard label="今週イベント" value={data.kpis.weekEventCount} />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard label="資格期限 30日以内" value={data.kpis.qualification30Count} />
        <KpiCard label="資格期限 90日以内" value={data.kpis.qualification90Count} />
        <KpiCard label="資格失効" value={data.kpis.qualificationExpiredCount} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Box title="直近期限のフォロー">
          <ul className="space-y-2 text-sm">
            {data.dueFollowups.length === 0 ? (
              <li className="text-gray-600">対象なし</li>
            ) : (
              data.dueFollowups.map((item) => (
                <li key={item.id} className="border rounded p-3">
                  <div className="font-medium">{item.employeeName}</div>
                  <div>種別：{item.followupType}</div>
                  <div>担当：{item.assigneeName}</div>
                  <div>期限：{item.dueDate}</div>
                  <Link className="underline text-xs" href={`/followups/${item.id}`}>
                    詳細を見る
                  </Link>
                </li>
              ))
            )}
          </ul>
        </Box>

        <Box title="期限超過フォロー">
          <ul className="space-y-2 text-sm">
            {data.overdueFollowups.length === 0 ? (
              <li className="text-gray-600">期限超過なし</li>
            ) : (
              data.overdueFollowups.map((item) => (
                <li key={item.id} className="border rounded p-3">
                  <div className="font-medium text-red-600">{item.employeeName}</div>
                  <div>種別：{item.followupType}</div>
                  <div>担当：{item.assigneeName}</div>
                  <div>期限：{item.dueDate}</div>
                  <Link className="underline text-xs" href={`/followups/${item.id}`}>
                    詳細を見る
                  </Link>
                </li>
              ))
            )}
          </ul>
        </Box>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Box title="資格期限アラート">
          <ul className="space-y-2 text-sm">
            {data.qualificationAlerts.length === 0 ? (
              <li className="text-gray-600">対象なし</li>
            ) : (
              data.qualificationAlerts.map((item) => (
                <li key={item.id} className="border rounded p-3">
                  <div className="font-medium">{item.employeeName}</div>
                  <div>資格：{item.qualificationName}</div>
                  <div className="text-red-600">期限：{item.expiresOn}</div>
                  <div>状態：{item.status}</div>
                </li>
              ))
            )}
          </ul>
        </Box>

        <Box title="新着通知">
          <ul className="space-y-2 text-sm">
            {data.notifications.length === 0 ? (
              <li className="text-gray-600">通知なし</li>
            ) : (
              data.notifications.map((item) => (
                <li key={item.id} className="border rounded p-3">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-gray-600">{item.body}</div>
                  <div className="text-xs mt-1">{new Date(item.createdAt).toLocaleString()}</div>
                </li>
              ))
            )}
          </ul>
        </Box>
      </section>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border rounded p-4">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-2xl font-semibold mt-2">{value}</div>
    </div>
  );
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border rounded p-4">
      <div className="font-medium mb-3">{title}</div>
      {children}
    </div>
  );
}