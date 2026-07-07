// src/app/(protected)/employee-analytics/page.tsx

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PageShell } from "@/components/ui/page-shell";
import { Hero, Card, Chip, PrimaryButton } from "@/components/ui/ux";
import { EmployeeAnalyticsFilters } from "@/components/employee-analytics/employee-analytics-filters";

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

type EmployeeWithAge = EmployeeRow & {
  age: number | null;
};

export default async function EmployeeAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const me = await requireAuth();
  const sp = await searchParams;

  if (me.role !== "admin" && me.role !== "hr" && me.role !== "manager") {
    redirect("/unauthorized");
  }

  const getParam = (key: string) => {
    const v = sp[key];
    return Array.isArray(v) ? v[0] ?? "" : v ?? "";
  };

  const statusFilter = getParam("status") || "active";
  const genderFilter = getParam("gender") || "all";
  const managementFilter = getParam("management") || "all";
  const employmentTypeFilter = getParam("employment_type") || "all";

  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("employees")
    .select(
      "id, employee_code, name, email, app_role, status, employment_type, birth_date, gender, is_management_role"
    )
    .order("employee_code", { ascending: true });

  if (error) throw error;

  const employees = (data ?? []) as EmployeeRow[];

  const filteredEmployees = employees.filter((e) => {
    if (statusFilter !== "all" && e.status !== statusFilter) {
      return false;
    }

    if (
      genderFilter !== "all" &&
      normalizeGender(e.gender) !== genderFilter
    ) {
      return false;
    }

    if (
      managementFilter === "management" &&
      e.is_management_role !== true
    ) {
      return false;
    }

    if (
      managementFilter === "non_management" &&
      e.is_management_role === true
    ) {
      return false;
    }

    if (employmentTypeFilter !== "all") {
      if (employmentTypeFilter === "unknown") {
        if (e.employment_type) return false;
      } else if (e.employment_type !== employmentTypeFilter) {
        return false;
      }
    }

    return true;
  });

  const ageItems: EmployeeWithAge[] = filteredEmployees
    .map((e) => {
      const age = calcAge(e.birth_date);

      return {
        ...e,
        age,
      };
    })
    .filter((e) => e.age !== null);

  const totalTarget = filteredEmployees.length;
  const ageInputCount = ageItems.length;

  const averageAge =
    ageItems.length > 0
      ? ageItems.reduce((sum, e) => sum + (e.age ?? 0), 0) / ageItems.length
      : null;

  const femaleCount = filteredEmployees.filter(
    (e) => normalizeGender(e.gender) === "female"
  ).length;

  const managementEmployees = filteredEmployees.filter(
    (e) => e.is_management_role === true
  );

  const managementCount = managementEmployees.length;

  const femaleManagementEmployees = managementEmployees.filter(
    (e) => normalizeGender(e.gender) === "female"
  );

  const femaleManagementCount = femaleManagementEmployees.length;

  const femaleRate =
    totalTarget > 0 ? Math.round((femaleCount / totalTarget) * 1000) / 10 : 0;

  const femaleManagementRate =
    managementCount > 0
      ? Math.round((femaleManagementCount / managementCount) * 1000) / 10
      : 0;

  const ageBuckets = buildAgeBuckets(ageItems);
  const genderBuckets = buildGenderBuckets(filteredEmployees);

  const employmentBuckets = buildCountBuckets(
    filteredEmployees.map((e) => e.employment_type || "未設定")
  );

  const roleBuckets = buildCountBuckets(
    filteredEmployees.map((e) => e.app_role || "未設定")
  );

  const noBirthDateEmployees = filteredEmployees.filter((e) => !e.birth_date);
  const noGenderEmployees = filteredEmployees.filter((e) => !e.gender);

  const exportHref = buildExportHref({
    status: statusFilter,
    gender: genderFilter,
    management: managementFilter,
    employmentType: employmentTypeFilter,
  });

  return (
    <PageShell>
      <div className="space-y-6">
        <Hero
          title="社員情報分析"
          subtitle="社員情報をもとに、平均年齢・女性役職者数・年齢分布などを可視化します。"
          meta={
            <div className="flex flex-wrap gap-2">
              <Chip tone="info">Employee Analytics</Chip>
              <Chip>対象: {getStatusFilterLabel(statusFilter)}</Chip>
              <Chip>表示件数: {totalTarget}名</Chip>
              <Chip tone="gray">閲覧権限: admin / hr / manager</Chip>

              {genderFilter !== "all" && (
                <Chip tone="info">性別: {getGenderFilterLabel(genderFilter)}</Chip>
              )}

              {managementFilter !== "all" && (
                <Chip tone="info">
                  役職者: {getManagementFilterLabel(managementFilter)}
                </Chip>
              )}

              {employmentTypeFilter !== "all" && (
                <Chip tone="info">
                  雇用区分: {getEmploymentLabel(employmentTypeFilter)}
                </Chip>
              )}
            </div>
          }
          right={
            <>
              <PrimaryButton href={exportHref}>CSV出力</PrimaryButton>
              <PrimaryButton href="/employees">社員一覧へ</PrimaryButton>
            </>
          }
        />

        <Card className="p-5">
          <div className="mb-4">
            <h2 className="text-lg font-black text-slate-900">
              分析条件
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              条件を変更すると、平均年齢・女性比率・年齢分布などが絞り込み後の社員で再集計されます。
            </p>
          </div>

          <EmployeeAnalyticsFilters
            status={statusFilter}
            gender={genderFilter}
            management={managementFilter}
            employmentType={employmentTypeFilter}
          />
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="対象社員数"
            value={`${totalTarget}名`}
            sub="現在の絞り込み条件に一致する社員"
          />

          <StatCard
            label="平均年齢"
            value={averageAge === null ? "-" : `${averageAge.toFixed(1)}歳`}
            sub={`年齢入力済み ${ageInputCount}名`}
          />

          <StatCard
            label="女性比率"
            value={`${femaleRate}%`}
            sub={`女性 ${femaleCount}名 / 対象 ${totalTarget}名`}
          />

          <StatCard
            label="女性役職者率"
            value={`${femaleManagementRate}%`}
            sub={`女性役職者 ${femaleManagementCount}名 / 役職者 ${managementCount}名`}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className="p-5">
            <SectionHeader
              title="年齢分布"
              description="生年月日が入力されている社員を対象に集計しています。"
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
                  {femaleManagementEmployees.map((e) => (
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

                  {femaleManagementEmployees.length === 0 && (
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
              正確な分析を行うには、社員編集画面で「生年月日」「性別」「役職者フラグ」を登録してください。
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Card className="p-5">
      <div className="text-sm font-black text-slate-500">{label}</div>
      <div className="mt-3 text-3xl font-black tracking-tight text-slate-900">
        {value}
      </div>

      {sub && (
        <div className="mt-2 text-xs font-semibold text-slate-400">{sub}</div>
      )}
    </Card>
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

function buildAgeBuckets(employees: EmployeeWithAge[]) {
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
      (b) =>
        employee.age !== null &&
        employee.age >= b.min &&
        employee.age <= b.max
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

function normalizeGender(
  value: string | null
): "male" | "female" | "other" | "unknown" {
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
  if (value === "unknown") return "未設定";
  if (value === "未設定") return "未設定";

  return value;
}

function getStatusFilterLabel(value: string) {
  if (value === "active") return "在籍中";
  if (value === "all") return "すべて";
  if (value === "leave") return "休職中";
  if (value === "inactive") return "退職・無効";

  return value || "在籍中";
}

function getGenderFilterLabel(value: string) {
  if (value === "male") return "男性";
  if (value === "female") return "女性";
  if (value === "other") return "その他";
  if (value === "unknown") return "未設定";
  if (value === "all") return "すべて";

  return value || "すべて";
}

function getManagementFilterLabel(value: string) {
  if (value === "management") return "役職者のみ";
  if (value === "non_management") return "役職者以外";
  if (value === "all") return "すべて";

  return value || "すべて";
}

function buildExportHref({
  status,
  gender,
  management,
  employmentType,
}: {
  status: string;
  gender: string;
  management: string;
  employmentType: string;
}) {
  const p = new URLSearchParams();

  if (status && status !== "active") p.set("status", status);
  if (gender && gender !== "all") p.set("gender", gender);
  if (management && management !== "all") p.set("management", management);
  if (employmentType && employmentType !== "all") {
    p.set("employment_type", employmentType);
  }

  const qs = p.toString();

  return `/api/employee-analytics/export${qs ? `?${qs}` : ""}`;
}