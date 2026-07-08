// src/app/(protected)/employees/code/[employeeCode]/page.tsx

import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { getEmployeeProfileBookByCode } from "@/lib/queries/employee-profile";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { EmployeeProfileBook } from "@/components/employees/employee-profile-book";
import { PageShell } from "@/components/ui/page-shell";
import { Hero, Card, Chip, GhostButton, PrimaryButton } from "@/components/ui/ux";

export const runtime = "nodejs";

const TAB_DEFAULT = "basic";

type AnalyticsEmployeeFields = {
  birth_date?: string | null;
  gender?: string | null;
  is_management_role?: boolean | null;
  organization_unit_id?: string | null;
};

type OrganizationUnitRow = {
  id: string;
  name: string;
};

export default async function EmployeeByCodePage({
  params,
  searchParams,
}: {
  params: Promise<{ employeeCode: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAuth();

  const { employeeCode } = await params;
  const sp = await searchParams;

  const tabParam = sp.tab;
  const tab = Array.isArray(tabParam)
    ? tabParam[0] ?? TAB_DEFAULT
    : tabParam ?? TAB_DEFAULT;

  const book = await getEmployeeProfileBookByCode(employeeCode);
  if (!book) return notFound();

  const employee = book.employee;
  const analyticsEmployee = employee as typeof employee & AnalyticsEmployeeFields;

  const admin = createSupabaseAdminClient();

  const { data: employeeOrgRow } = await admin
    .from("employees")
    .select("id, organization_unit_id")
    .eq("id", employee.id)
    .maybeSingle();

  const organizationUnitId =
    employeeOrgRow?.organization_unit_id ??
    analyticsEmployee.organization_unit_id ??
    null;

  const { data: organizationUnit } = organizationUnitId
    ? await admin
        .from("organization_units")
        .select("id, name")
        .eq("id", organizationUnitId)
        .maybeSingle()
    : { data: null as OrganizationUnitRow | null };

  const organizationName = organizationUnit?.name ?? "未設定";

  const age = calcAge(analyticsEmployee.birth_date ?? null);
  const genderLabel = getGenderLabel(analyticsEmployee.gender ?? null);
  const managementLabel =
    analyticsEmployee.is_management_role === true ? "対象" : "対象外";

  return (
    <PageShell>
      <div className="space-y-6">
        <Hero
          title={employee.name ?? "社員カルテ"}
          subtitle="基本情報、所属組織、キャリア希望、資格、年間イベント、面談履歴を確認できます。"
          meta={
            <div className="flex flex-wrap gap-2">
              <Chip tone="info">Employee Profile</Chip>
              <Chip>社員番号: {employee.employee_code}</Chip>

              <Chip tone={organizationName === "未設定" ? "danger" : "gray"}>
                所属組織: {organizationName}
              </Chip>

              {employee.status && (
                <Chip tone={employee.status === "active" ? "ok" : "gray"}>
                  状態: {employee.status}
                </Chip>
              )}

              {employee.app_role && <Chip>権限: {employee.app_role}</Chip>}

              <Chip tone="info">表示タブ: {tab}</Chip>
            </div>
          }
          right={
            <>
              <GhostButton href="/employees">社員一覧へ戻る</GhostButton>
              <PrimaryButton
                href={`/employees/code/${employee.employee_code}/edit`}
              >
                社員情報を編集
              </PrimaryButton>
            </>
          }
        />

        <Card className="p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-xs font-black tracking-[0.16em] text-indigo-600">
                ANALYTICS DATA
              </div>
              <h2 className="mt-2 text-xl font-black text-slate-900">
                分析項目
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                所属組織、平均年齢、女性比率、女性役職者率などの分析に使用される項目です。
              </p>
            </div>

            <PrimaryButton href="/employee-analytics">
              社員分析を見る
            </PrimaryButton>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
            <AnalyticsItem
              label="所属組織"
              value={organizationName}
              sub={
                organizationName === "未設定"
                  ? "所属組織が未設定です"
                  : "組織別分析・所属組織フィルターに反映されます"
              }
              tone={organizationName === "未設定" ? "danger" : "ok"}
            />

            <AnalyticsItem
              label="年齢"
              value={age === null ? "未入力" : `${age}歳`}
              sub={
                analyticsEmployee.birth_date
                  ? `生年月日: ${analyticsEmployee.birth_date}`
                  : "生年月日が未入力です"
              }
              tone={age === null ? "danger" : "ok"}
            />

            <AnalyticsItem
              label="性別"
              value={genderLabel}
              sub={
                analyticsEmployee.gender
                  ? `gender: ${analyticsEmployee.gender}`
                  : "性別が未設定です"
              }
              tone={
                analyticsEmployee.gender && analyticsEmployee.gender !== "unknown"
                  ? "ok"
                  : "danger"
              }
            />

            <AnalyticsItem
              label="役職者"
              value={managementLabel}
              sub={
                analyticsEmployee.is_management_role === true
                  ? "女性役職者率などの集計対象です"
                  : "役職者集計の対象外です"
              }
              tone={
                analyticsEmployee.is_management_role === true ? "ok" : "gray"
              }
            />
          </div>

          {(!organizationUnitId ||
            !analyticsEmployee.birth_date ||
            !analyticsEmployee.gender ||
            analyticsEmployee.gender === "unknown") && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-700">
              分析精度を上げるには、社員編集画面で「所属組織」「生年月日」「性別」「役職者フラグ」を登録してください。
            </div>
          )}
        </Card>

        <Card className="overflow-hidden">
          <EmployeeProfileBook
            employee={book.employee}
            profile={book.profile}
            goals={book.goals}
            qualifications={book.qualifications}
            events={book.events}
            interviews={book.interviews}
            positionHistories={book.positionHistories}
            activityLogs={book.activityLogs ?? []}
            activeTab={tab}
          />
        </Card>
      </div>
    </PageShell>
  );
}

function AnalyticsItem({
  label,
  value,
  sub,
  tone = "gray",
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "ok" | "danger" | "gray";
}) {
  const toneClass =
    tone === "ok"
      ? "border-emerald-200 bg-emerald-50"
      : tone === "danger"
        ? "border-rose-200 bg-rose-50"
        : "border-slate-200 bg-slate-50";

  const valueClass =
    tone === "ok"
      ? "text-emerald-700"
      : tone === "danger"
        ? "text-rose-700"
        : "text-slate-900";

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="text-xs font-black tracking-[0.12em] text-slate-500">
        {label}
      </div>
      <div className={`mt-2 text-2xl font-black ${valueClass}`}>{value}</div>
      <div className="mt-1 text-xs font-semibold leading-5 text-slate-500">
        {sub}
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

function getGenderLabel(value: string | null) {
  if (value === "male") return "男性";
  if (value === "female") return "女性";
  if (value === "other") return "その他";
  if (value === "unknown") return "未設定";

  return "未設定";
}