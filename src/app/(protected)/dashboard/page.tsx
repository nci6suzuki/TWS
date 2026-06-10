import Link from "next/link";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PageShell } from "@/components/ui/page-shell";
import { Card, Chip, KPI, Hero, PrimaryButton } from "@/components/ui/ux";

export const runtime = "nodejs";

type Qualification = {
  id: string;
  employee_id: string;
  qualification_name: string;
  acquired_on: string | null;
  expires_on: string | null;
  status: string;
  memo: string | null;
};

type Employee = {
  id: string;
  employee_code: string;
  name: string;
  email: string | null;
};

export default async function DashboardPage() {
  const me = await requireAuth();
  const admin = createSupabaseAdminClient();

  const isAdminOrHr = me.role === "admin" || me.role === "hr";

  const today = new Date().toISOString().slice(0, 10);

  const alertDateObj = new Date();
  alertDateObj.setDate(alertDateObj.getDate() + 30);
  const alertDate = alertDateObj.toISOString().slice(0, 10);

  let qualificationQuery = admin
    .from("employee_qualifications")
    .select(
      "id, employee_id, qualification_name, acquired_on, expires_on, status, memo"
    )
    .not("expires_on", "is", null)
    .order("expires_on", { ascending: true });

  if (!isAdminOrHr) {
    qualificationQuery = qualificationQuery.eq("employee_id", me.employeeId);
  }

  const { data: qualificationData, error: qualificationError } =
    await qualificationQuery;

  if (qualificationError) throw qualificationError;

  const qualifications = (qualificationData ?? []) as Qualification[];

  const alertQualifications = qualifications.filter(
    (q) => q.expires_on && q.expires_on <= alertDate
  );

  const employeeIds = Array.from(
    new Set(alertQualifications.map((q) => q.employee_id))
  );

  let employees: Employee[] = [];

  if (employeeIds.length > 0) {
    const { data: employeeData, error: employeeError } = await admin
      .from("employees")
      .select("id, employee_code, name, email")
      .in("id", employeeIds);

    if (employeeError) throw employeeError;

    employees = (employeeData ?? []) as Employee[];
  }

  const employeeMap = new Map(employees.map((e) => [e.id, e]));

  const expiredQualifications = alertQualifications.filter(
    (q) => q.expires_on && q.expires_on < today
  );

  const expiringSoonQualifications = alertQualifications.filter(
    (q) => q.expires_on && q.expires_on >= today && q.expires_on <= alertDate
  );

  const totalAlertCount =
    expiredQualifications.length + expiringSoonQualifications.length;

  return (
    <PageShell>
      <div className="space-y-6">
        <Hero
          title="ダッシュボード"
          subtitle="対応が必要な資格更新や社員管理の状況を確認できます。"
          meta={
            <div className="flex flex-wrap gap-2">
              <Chip tone="info">Dashboard</Chip>
              <Chip>ログイン権限: {me.role}</Chip>
              {isAdminOrHr ? (
                <Chip tone="info">全社員の資格アラートを表示</Chip>
              ) : (
                <Chip>自分の資格アラートを表示</Chip>
              )}
            </div>
          }
          right={
            <>
              <PrimaryButton href="/employees">社員一覧</PrimaryButton>
              <PrimaryButton href="/annual-events">年間イベント</PrimaryButton>
            </>
          }
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <KPI
            label="資格アラート"
            value={totalAlertCount}
            tone={totalAlertCount > 0 ? "danger" : "ok"}
          />
          <KPI
            label="期限切れ"
            value={expiredQualifications.length}
            tone={expiredQualifications.length > 0 ? "danger" : "ok"}
          />
          <KPI
            label="30日以内"
            value={expiringSoonQualifications.length}
            tone={expiringSoonQualifications.length > 0 ? "danger" : "ok"}
          />
        </div>

        <Card className="overflow-hidden">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                資格更新アラート
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                有効期限切れ、または30日以内に期限が来る資格を表示しています。
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Chip tone="danger">期限切れ: {expiredQualifications.length}</Chip>
              <span className="inline-flex items-center rounded-xl border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                30日以内: {expiringSoonQualifications.length}
              </span>
            </div>
          </div>

          <div className="overflow-auto">
            <table className="min-w-[1000px] w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-3 text-left font-black">状態</th>
                  <th className="px-5 py-3 text-left font-black">社員</th>
                  <th className="px-5 py-3 text-left font-black">社員番号</th>
                  <th className="px-5 py-3 text-left font-black">資格名</th>
                  <th className="px-5 py-3 text-left font-black">取得日</th>
                  <th className="px-5 py-3 text-left font-black">有効期限</th>
                  <th className="px-5 py-3 text-left font-black">メモ</th>
                  <th className="px-5 py-3 text-left font-black">操作</th>
                </tr>
              </thead>

              <tbody>
                {alertQualifications.map((q) => {
                  const employee = employeeMap.get(q.employee_id);
                  const isExpired = q.expires_on && q.expires_on < today;
                  const isExpiringSoon =
                    q.expires_on &&
                    q.expires_on >= today &&
                    q.expires_on <= alertDate;

                  return (
                    <tr
                      key={q.id}
                      className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        {isExpired ? (
                          <Chip tone="danger">期限切れ</Chip>
                        ) : isExpiringSoon ? (
                          <span className="inline-flex items-center rounded-xl border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                            30日以内
                          </span>
                        ) : (
                          <Chip tone="ok">有効</Chip>
                        )}
                      </td>

                      <td className="px-5 py-4 font-black text-slate-900">
                        {employee?.name ?? "-"}
                      </td>

                      <td className="px-5 py-4">
                        {employee?.employee_code ? (
                          <Link
                            href={`/employees/code/${employee.employee_code}`}
                            className="inline-flex items-center rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-800 hover:bg-slate-200"
                          >
                            {employee.employee_code}
                          </Link>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-700">
                        {q.qualification_name}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {q.acquired_on ?? "-"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={[
                            "font-black",
                            isExpired
                              ? "text-rose-600"
                              : isExpiringSoon
                              ? "text-amber-600"
                              : "text-slate-600",
                          ].join(" ")}
                        >
                          {q.expires_on}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {q.memo || "-"}
                      </td>

                      <td className="px-5 py-4">
                        {employee?.employee_code ? (
                          <Link
                            href={`/employees/code/${employee.employee_code}/qualifications`}
                            className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:bg-slate-50"
                          >
                            資格管理
                          </Link>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {alertQualifications.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center">
                      <div className="text-sm font-bold text-slate-500">
                        現在、対応が必要な資格アラートはありません
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-lg font-black text-slate-900">
              社員管理
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              社員情報、招待状況、社員カルテを確認します。
            </p>

            <div className="mt-4">
              <Link
                href="/employees"
                className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-4 text-sm font-black text-white hover:bg-slate-800"
              >
                社員一覧へ
              </Link>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-black text-slate-900">
              年間イベント
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              面談、評価、研修、更新確認などの年間予定を管理します。
            </p>

            <div className="mt-4">
              <Link
                href="/annual-events"
                className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
              >
                年間イベントへ
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}