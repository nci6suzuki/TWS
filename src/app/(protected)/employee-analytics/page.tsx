// src/app/(protected)/employee-analytics/page.tsx

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PageShell } from "@/components/ui/page-shell";
import { Hero, Card, Chip, KPI, PrimaryButton } from "@/components/ui/ux";

export const runtime = "nodejs";

type EmployeeRow = {
  id: string;
  employee_code: string | null;
  name: string | null;
  email: string | null;
  app_role: string | null;
  status: string | null;
  employment_type: string | null;
  birth_date: string | null;
  gender: string | null;
  is_management_role: boolean | null;
};

export default async function EmployeeAnalyticsPage() {
  const me = await requireAuth();

  if (
    me.role !== "admin" &&
    me.role !== "hr" &&
    me.role !== "manager"
  ) {
    redirect("/unauthorized");
  }

  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("employees")
    .select(
      "id, employee_code, name, email, app_role, status, employment_type, birth_date, gender, is_management_role"
    )
    .order("employee_code", { ascending: true });

  if (error) throw error;

  const employees = (data ?? []) as EmployeeRow[];

  const activeEmployees = employees.filter((e) => e.status === "active");

  const ageItems = activeEmployees
    .map((e) => {
      const age = calcAge(e.birth_date);
      return {
        ...e,
        age,
      };
    })
    .filter((e) => e.age !== null);

  const totalActive = activeEmployees.length;
  const ageInputCount = ageItems.length;

  const averageAge =
    ageItems.length > 0
      ? ageItems.reduce((sum, e) => sum + (e.age ?? 0), 0) / ageItems.length
      : null;

  const femaleCount = activeEmployees.filter(
    (e) => normalizeGender(e.gender) === "female"
  ).length;

  const managementEmployees = activeEmployees.filter(
    (e) => e.is_management_role === true
  );

  const managementCount = managementEmployees.length;

  const femaleManagementCount = managementEmployees.filter(
    (e) => normalizeGender(e.gender) === "female"
  ).length;

  const femaleRate =
    totalActive > 0 ? Math.round((femaleCount / totalActive) * 1000) / 10 : 0;

  const femaleManagementRate =
    managementCount > 0
      ? Math.round((femaleManagementCount / managementCount) * 1000) / 10
      : 0;

  const ageBuckets = buildAgeBuckets(ageItems);
  const genderBuckets = buildGenderBuckets(activeEmployees);
  const employmentBuckets = buildCountBuckets(
    activeEmployees.map((e) => e.employment_type || "未設定")
  );
  const roleBuckets = buildCountBuckets(
    activeEmployees.map((e) => e.app_role || "未設定")
  );

  const noBirthDateEmployees = activeEmployees.filter((e) => !e.birth_date);
  const noGenderEmployees = activeEmployees.filter((e) => !e.gender);

  return (
    <PageShell>
      <div className="space-y-6">
        <Hero
          title="社員情報分析"
          subtitle="社員情報をもとに、平均年齢・女性役職者数・年齢分布などを可視化します。"
          meta={
            <div className="flex flex-wrap gap-2">
              <Chip tone="info">Employee Analytics</Chip>
              <Chip>対象: 在籍中社員</Chip>
              <Chip tone="gray">閲覧権限: admin / hr / manager</Chip>
            </div>
          }
          right={
            <>
              <PrimaryButton href="/employees">社員一覧へ</PrimaryButton>
            </>
          }
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KPI
            label="在籍中社員数"
            value={`${totalActive}名`}
            sub="status = active の社員"
            tone="ok"
          />
          <KPI
            label="平均年齢"
            value={averageAge === null ? "-" : `${averageAge.toFixed(1)}歳`}
            sub={`年齢入力済み ${ageInputCount}名`}
          />
          <KPI
            label="女性比率"
            value={`${femaleRate}%`}
            sub={`女性 ${femaleCount}名 / 在籍中 ${totalActive}名`}
          />
          <KPI
            label="女性役職者率"
            value={`${femaleManagementRate}%`}
            sub={`女性役職者 ${femaleManagementCount}名 / 役職者 ${managementCount}名`}
            tone={femaleManagementCount > 0 ? "ok" : undefined}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className="p-5">
            <SectionHeader
              title="年齢分布"
              description="生年月日が入力されている在籍中社員を対象に集計しています。"
            />
            <div className="mt-5 space-y-3">
              {ageBuckets.map((b) => (
                <BarRow
                  key={b.label}
                  label={b.label}
                  value={b.count}
                  max={Math.max(...ageBuckets.map((x) => x.count), 1)}
                  suffix="名"
                />
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <SectionHeader
              title="性別分布"
              description="社員情報の gender をもとに集計しています。"
            />
            <div className="mt-5 space-y-3">
              {genderBuckets.map((b) => (
                <BarRow
                  key={b.label}
                  label={b.label}
                  value={b.count}
                  max={Math.max(...genderBuckets.map((x) => x.count), 1)}
                  suffix="名"
                />
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <SectionHeader
              title="雇用区分別人数"
              description="employment_type ごとの人数です。"
            />
            <div className="mt-5 space-y-3">
              {employmentBuckets.map((b) => (
                <BarRow
                  key={b.label}
                  label={getEmploymentLabel(b.label)}
                  value={b.count}
                  max={Math.max(...employmentBuckets.map((x) => x.count), 1)}
                  suffix="名"
                />
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <SectionHeader
              title="システムロール別人数"
              description="app_role ごとの人数です。役職とは別のシステム権限です。"
            />
            <div className="mt-5 space-y-3">
              {roleBuckets.map((b) => (
                <BarRow
                  key={b.label}
                  label={b.label}
                  value={b.count}
                  max={Math.max(...roleBuckets.map((x) => x.count), 1)}
                  suffix="名"
                />
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className="p-5">
            <SectionHeader
              title="女性役職者"
              description="is_management_role が true、かつ gender が female の社員です。"
            />

            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-black text-slate-500">
                  <tr>
                    <th className="px-4 py-3">社員番号</th>
                    <th className="px-4 py-3">氏名</th>
                    <th className="px-4 py-3">年齢</th>
                    <th className="px-4 py-3">ロール</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {managementEmployees
                    .filter((e) => normalizeGender(e.gender) === "female")
                    .map((e) => (
                      <tr key={e.id}>
                        <td className="px-4 py-3 font-bold text-slate-700">
                          {e.employee_code ?? "-"}
                        </td>
                        <td className="px-4 py-3 font-black text-slate-900">
                          {e.name ?? "-"}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-600">
                          {calcAge(e.birth_date) ?? "-"}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-600">
                          {e.app_role ?? "-"}
                        </td>
                      </tr>
                    ))}

                  {femaleManagementCount === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-sm font-semibold text-slate-400"
                      >
                        女性役職者の登録がありません。
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-5">
            <SectionHeader
              title="未入力チェック"
              description="分析精度を上げるために、未入力の社員情報を確認します。"
            />

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm font-black text-slate-900">
                  生年月日未入力
                </div>
                <div className="mt-2 text-3xl font-black text-slate-900">
                  {noBirthDateEmployees.length}名
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  平均年齢・年齢分布に反映されません。
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm font-black text-slate-900">
                  性別未入力
                </div>
                <div className="mt-2 text-3xl font-black text-slate-900">
                  {noGenderEmployees.length}名
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  女性比率・女性役職者率に反映されません。
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-700">
              正確な分析を行うには、社員編集画面で「生年月日」「性別」「役職者フラグ」を登録できるようにする必要があります。
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-black text-slate-900">{title}</h2>
      <p className="mt-1 text-sm font-semibold text-slate-500">
        {description}
      </p>
    </div>
  );
}

function BarRow({
  label,
  value,
  max,
  suffix,
}: {
  label: string;
  value: number;
  max: number;
  suffix: string;
}) {
  const width = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <div className="text-sm font-black text-slate-700">{label}</div>
        <div className="text-sm font-black text-slate-900">
          {value}
          {suffix}
        </div>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-slate-900"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function calcAge(birthDate: string | null) {
  if (!birthDate) return null;

  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();

  const monthDiff = today.getMonth() - birth.getMonth();
  const dayDiff = today.getDate() - birth.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  if (age < 0 || age > 120) return null;

  return age;
}

function buildAgeBuckets(
  employees: Array<EmployeeRow & { age: number | null }>
) {
  const buckets = [
    { label: "10代", min: 10, max: 19, count: 0 },
    { label: "20代", min: 20, max: 29, count: 0 },
    { label: "30代", min: 30, max: 39, count: 0 },
    { label: "40代", min: 40, max: 49, count: 0 },
    { label: "50代", min: 50, max: 59, count: 0 },
    { label: "60代", min: 60, max: 69, count: 0 },
    { label: "70代以上", min: 70, max: 120, count: 0 },
  ];

  for (const employee of employees) {
    if (employee.age === null) continue;

    const bucket = buckets.find(
      (b) => employee.age !== null && employee.age >= b.min && employee.age <= b.max
    );

    if (bucket) bucket.count += 1;
  }

  return buckets.map(({ label, count }) => ({ label, count }));
}

function buildGenderBuckets(employees: EmployeeRow[]) {
  const counts = {
    male: 0,
    female: 0,
    other: 0,
    unknown: 0,
  };

  for (const employee of employees) {
    const gender = normalizeGender(employee.gender);
    counts[gender] += 1;
  }

  return [
    { label: "男性", count: counts.male },
    { label: "女性", count: counts.female },
    { label: "その他", count: counts.other },
    { label: "未設定", count: counts.unknown },
  ];
}

function buildCountBuckets(values: string[]) {
  const map = new Map<string, number>();

  for (const value of values) {
    const key = value || "未設定";
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function normalizeGender(value: string | null): "male" | "female" | "other" | "unknown" {
  if (!value) return "unknown";

  if (value === "male") return "male";
  if (value === "female") return "female";
  if (value === "other") return "other";

  return "unknown";
}

function getEmploymentLabel(value: string) {
  if (value === "full_time") return "正社員";
  if (value === "contract") return "契約社員";
  if (value === "part_time") return "パート";
  if (value === "other") return "その他";
  if (value === "未設定") return "未設定";
  return value;
}