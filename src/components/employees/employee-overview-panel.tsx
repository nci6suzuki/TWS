import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Me } from "@/types/api";

export async function EmployeeOverviewPanel({ me, employeeId }: { me: Me; employeeId: string }) {
  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString().slice(0, 10);
  const canManage = me.role === "admin" || me.role === "hr" || me.role === "manager";

  const [qualificationRes, interviewRes, eventRes] = await Promise.all([
    supabase
      .from("employee_qualifications")
      .select("id, expires_on, status, qualification_master:qualification_id ( name )")
      .eq("employee_id", employeeId)
      .order("expires_on", { ascending: true })
      .limit(5),
    supabase
      .from("interview_records")
      .select("id, interview_date, interview_type")
      .eq("employee_id", employeeId)
      .order("interview_date", { ascending: false })
      .limit(5),
    supabase
      .from("employee_annual_events")
      .select("id, title, scheduled_date, status, event_type")
      .eq("employee_id", employeeId)
      .gte("scheduled_date", today)
      .order("scheduled_date", { ascending: true })
      .limit(5),
  ]);

  // ★ ここが重要：never[] 推論を回避して any[] に固定
  const qualifications: any[] = (qualificationRes.data ?? []) as any[];
  const interviews: any[] = (interviewRes.data ?? []) as any[];
  const events: any[] = (eventRes.data ?? []) as any[];

  const nextQualification: any = qualifications.find((item: any) => item.expires_on);
  const latestInterview: any = interviews[0];
  const nextEvent: any = events[0];

  // ★ qualification_master が配列でもオブジェクトでも取れるようにする
  const qm: any = nextQualification?.qualification_master;
  const qualificationName = Array.isArray(qm) ? qm[0]?.name : qm?.name;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          label="保有資格"
          value={String(qualifications.length)}
          sub={nextQualification ? `次回期限: ${nextQualification.expires_on}` : "期限登録なし"}
        />
        <MetricCard
          label="面談履歴"
          value={String(interviews.length)}
          sub={latestInterview ? `最新: ${formatDateTime(latestInterview.interview_date)}` : "面談記録なし"}
        />
        <MetricCard
          label="今後イベント"
          value={String(events.length)}
          sub={nextEvent ? `直近: ${nextEvent.scheduled_date}` : "予定なし"}
        />
        <MetricCard
          label="操作"
          value={canManage ? "管理可" : "参照"}
          sub={canManage ? "面談・イベント登録に対応" : "参照権限で表示"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-slate-900">直近アクティビティ</h3>
            <Link
              href={`/employees/${employeeId}?tab=interviews`}
              className="text-sm font-semibold text-indigo-700 no-underline hover:underline"
            >
              すべて見る
            </Link>
          </div>

          <div className="mt-4 space-y-3 text-sm">
            {latestInterview && (
              <OverviewRow
                label="最新面談"
                value={`${formatDateTime(latestInterview.interview_date)} / ${latestInterview.interview_type}`}
              />
            )}

            {nextQualification && (
              <OverviewRow
                label="資格期限"
                value={`${qualificationName ?? "資格"} / ${nextQualification.expires_on}`}
              />
            )}

            {nextEvent && (
              <OverviewRow label="次回イベント" value={`${nextEvent.scheduled_date} / ${nextEvent.title}`} />
            )}

            {!latestInterview && !nextQualification && !nextEvent && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-slate-500">
                直近アクティビティはまだ登録されていません。
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-bold text-slate-900">クイックアクション</h3>
          <div className="mt-4 grid gap-3 text-sm">
            <ActionLink href={`/interviews/new?employeeId=${employeeId}`} label="面談記録を作成" description="1on1・評価面談の登録" />
            <ActionLink href={`/annual-events/new?employeeId=${employeeId}`} label="イベントを登録" description="研修・年次イベントの予定追加" />
            <ActionLink href={`/employees/${employeeId}?tab=qualifications`} label="資格を確認" description="期限切れや更新予定を確認" />
            {canManage && <ActionLink href={`/employees/${employeeId}/edit`} label="社員情報を編集" description="所属や基本情報の更新" />}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold tracking-[0.12em] text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{sub}</div>
    </div>
  );
}

function OverviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800">{value}</span>
    </div>
  );
}

function ActionLink({ href, label, description }: { href: string; label: string; description: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-slate-200 px-4 py-3 no-underline transition hover:border-indigo-300 hover:bg-indigo-50/60">
      <div className="font-semibold text-slate-900">{label}</div>
      <div className="mt-1 text-slate-500">{description}</div>
    </Link>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ja-JP");
}