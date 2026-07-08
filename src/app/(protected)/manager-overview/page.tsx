// src/app/(protected)/manager-overview/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PageShell } from "@/components/ui/page-shell";
import { Hero, Card, Chip, PrimaryButton, GhostButton } from "@/components/ui/ux";
import { buttonClassName } from "@/lib/ui/button-class";

export const runtime = "nodejs";

type EmployeeRow = {
  id: string;
  employee_code: string | null;
  name: string | null;
  email: string | null;
  app_role: string | null;
  status: string | null;
  employment_type: string | null;
  organization_unit_id: string | null;
  manager_employee_id: string | null;
  position_title: string | null;
  position_started_on: string | null;
};

type OrganizationUnitRow = {
  id: string;
  name: string;
};

type ManagerGroup = {
  manager: EmployeeRow;
  members: EmployeeRow[];
};

export default async function ManagerOverviewPage() {
  const me = await requireAuth();

  if (me.role !== "admin" && me.role !== "hr" && me.role !== "manager") {
    redirect("/unauthorized");
  }

  const admin = createSupabaseAdminClient();

  const [{ data: employeesData, error }, { data: organizationUnits, error: orgError }] =
    await Promise.all([
      admin
        .from("employees")
        .select(
          "id, employee_code, name, email, app_role, status, employment_type, organization_unit_id, manager_employee_id, position_title, position_started_on"
        )
        .order("employee_code", { ascending: true }),
      admin
        .from("organization_units")
        .select("id, name")
        .order("name", { ascending: true }),
    ]);

  if (error) throw error;
  if (orgError) throw orgError;

  const employees = (employeesData ?? []) as EmployeeRow[];
  const organizations = (organizationUnits ?? []) as OrganizationUnitRow[];

  const organizationById = new Map(
    organizations.map((org) => [org.id, org.name])
  );

  const employeeById = new Map(employees.map((employee) => [employee.id, employee]));

  const activeEmployees = employees.filter((employee) => employee.status === "active");

  const unassignedEmployees = activeEmployees.filter(
    (employee) => !employee.manager_employee_id
  );

  const groupedByManagerId = new Map<string, EmployeeRow[]>();

  for (const employee of activeEmployees) {
    if (!employee.manager_employee_id) continue;

    const current = groupedByManagerId.get(employee.manager_employee_id) ?? [];
    current.push(employee);
    groupedByManagerId.set(employee.manager_employee_id, current);
  }

  const managerGroups: ManagerGroup[] = Array.from(groupedByManagerId.entries())
    .map(([managerId, members]) => {
      const manager = employeeById.get(managerId);

      if (!manager) return null;

      return {
        manager,
        members: members.sort((a, b) =>
          String(a.employee_code ?? "").localeCompare(String(b.employee_code ?? ""))
        ),
      };
    })
    .filter((group): group is ManagerGroup => group !== null)
    .sort((a, b) => b.members.length - a.members.length);

  const managedEmployeeCount = managerGroups.reduce(
    (sum, group) => sum + group.members.length,
    0
  );

  const managerCount = managerGroups.length;

  return (
    <PageShell>
      <div className="space-y-6">
        <Hero
          title="上司別 配下社員"
          subtitle="直属上司ごとに、配下社員・所属組織・現在役職を確認できます。"
          meta={
            <div className="flex flex-wrap gap-2">
              <Chip tone="info">Manager Overview</Chip>
              <Chip>上司数: {managerCount}名</Chip>
              <Chip>配下設定済み: {managedEmployeeCount}名</Chip>
              <Chip tone={unassignedEmployees.length > 0 ? "danger" : "ok"}>
                上司未設定: {unassignedEmployees.length}名
              </Chip>
            </div>
          }
          right={
            <>
              <PrimaryButton href="/employees">社員一覧へ</PrimaryButton>
              <PrimaryButton href="/organization">シナプスツリーへ</PrimaryButton>
              <GhostButton href="/employee-analytics">社員分析へ</GhostButton>
            </>
          }
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <SummaryCard
            label="在籍社員数"
            value={`${activeEmployees.length}名`}
            description="status が active の社員"
          />

          <SummaryCard
            label="上司数"
            value={`${managerCount}名`}
            description="配下社員が1名以上いる社員"
          />

          <SummaryCard
            label="配下設定済み"
            value={`${managedEmployeeCount}名`}
            description="直属上司が設定されている在籍社員"
          />

          <SummaryCard
            label="上司未設定"
            value={`${unassignedEmployees.length}名`}
            description="直属上司が未設定の在籍社員"
            danger={unassignedEmployees.length > 0}
          />
        </div>

        {unassignedEmployees.length > 0 && (
          <Card className="border-rose-200 bg-rose-50 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-black text-rose-700">
                  上司未設定の社員がいます
                </h2>
                <p className="mt-1 text-sm font-semibold text-rose-600">
                  社員編集画面から直属上司を設定してください。
                </p>
              </div>

              <Link
                href="/employees"
                className={buttonClassName(
                  "inline-flex h-10 items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-black text-white hover:bg-rose-700"
                )}
              >
                社員一覧で確認
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {unassignedEmployees.slice(0, 12).map((employee) => (
                <EmployeeMiniCard
                  key={employee.id}
                  employee={employee}
                  organizationById={organizationById}
                />
              ))}
            </div>

            {unassignedEmployees.length > 12 && (
              <div className="mt-3 text-sm font-bold text-rose-600">
                他 {unassignedEmployees.length - 12} 名います。
              </div>
            )}
          </Card>
        )}

        <div className="space-y-5">
          {managerGroups.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-lg font-black text-slate-900">
                配下社員が設定されている上司がいません
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                社員編集画面で直属上司を設定すると、この画面に表示されます。
              </p>
            </Card>
          ) : (
            managerGroups.map((group) => (
              <Card key={group.manager.id} className="overflow-hidden">
                <div className="border-b border-slate-100 bg-slate-50 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Chip tone="info">上司</Chip>
                        <Chip>{group.manager.employee_code ?? "-"}</Chip>
                        <Chip>{getStatusLabel(group.manager.status)}</Chip>
                        <Chip>{group.manager.position_title || "役職未設定"}</Chip>
                      </div>

                      <h2 className="mt-3 text-2xl font-black text-slate-900">
                        {group.manager.name ?? "-"}
                      </h2>

                      <div className="mt-2 text-sm font-semibold text-slate-500">
                        {group.manager.email ?? "-"}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                        <span>
                          所属組織:{" "}
                          {getOrganizationName(
                            group.manager.organization_unit_id,
                            organizationById
                          )}
                        </span>
                        <span>配下社員: {group.members.length}名</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {group.manager.employee_code && (
                        <>
                          <Link
                            href={`/employees/code/${encodeURIComponent(
                              group.manager.employee_code
                            )}`}
                            className={buttonClassName(
                              "inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:bg-slate-50"
                            )}
                          >
                            上司カルテ
                          </Link>

                          <Link
                            href={`/employees/code/${encodeURIComponent(
                              group.manager.employee_code
                            )}/edit`}
                            className={buttonClassName(
                              "inline-flex h-9 items-center rounded-xl bg-slate-900 px-3 text-xs font-black text-white hover:bg-slate-800"
                            )}
                          >
                            上司を編集
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full min-w-[1000px] text-sm">
                      <thead className="bg-white text-xs font-black text-slate-500">
                        <tr className="border-b border-slate-200">
                          <th className="px-4 py-3 text-left">社員番号</th>
                          <th className="px-4 py-3 text-left">氏名</th>
                          <th className="px-4 py-3 text-left">メール</th>
                          <th className="px-4 py-3 text-left">所属組織</th>
                          <th className="px-4 py-3 text-left">現在役職</th>
                          <th className="px-4 py-3 text-left">役職開始日</th>
                          <th className="px-4 py-3 text-left">状態</th>
                          <th className="px-4 py-3 text-left">操作</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100 bg-white">
                        {group.members.map((member) => (
                          <tr key={member.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-black text-slate-700">
                              {member.employee_code ?? "-"}
                            </td>

                            <td className="px-4 py-3 font-black text-slate-900">
                              {member.name ?? "-"}
                            </td>

                            <td className="px-4 py-3 font-semibold text-slate-600">
                              {member.email ?? "-"}
                            </td>

                            <td className="px-4 py-3 font-semibold text-slate-600">
                              {getOrganizationName(
                                member.organization_unit_id,
                                organizationById
                              )}
                            </td>

                            <td className="px-4 py-3">
                              <Chip tone={member.position_title ? "info" : "danger"}>
                                {member.position_title || "未設定"}
                              </Chip>
                            </td>

                            <td className="px-4 py-3 font-semibold text-slate-600">
                              {member.position_started_on ?? "-"}
                            </td>

                            <td className="px-4 py-3">
                              <Chip
                                tone={member.status === "active" ? "ok" : "danger"}
                              >
                                {getStatusLabel(member.status)}
                              </Chip>
                            </td>

                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                {member.employee_code ? (
                                  <>
                                    <Link
                                      href={`/employees/code/${encodeURIComponent(
                                        member.employee_code
                                      )}`}
                                      className={buttonClassName(
                                        "inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:bg-slate-50"
                                      )}
                                    >
                                      詳細
                                    </Link>

                                    <Link
                                      href={`/employees/code/${encodeURIComponent(
                                        member.employee_code
                                      )}/edit`}
                                      className={buttonClassName(
                                        "inline-flex h-8 items-center rounded-lg bg-slate-900 px-3 text-xs font-black text-white hover:bg-slate-800"
                                      )}
                                    >
                                      編集
                                    </Link>
                                  </>
                                ) : (
                                  "-"
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </PageShell>
  );
}

function SummaryCard({
  label,
  value,
  description,
  danger,
}: {
  label: string;
  value: string;
  description: string;
  danger?: boolean;
}) {
  return (
    <Card
      className={[
        "p-5",
        danger ? "border-rose-200 bg-rose-50" : "bg-white",
      ].join(" ")}
    >
      <div
        className={[
          "text-sm font-black",
          danger ? "text-rose-700" : "text-slate-500",
        ].join(" ")}
      >
        {label}
      </div>
      <div
        className={[
          "mt-3 text-3xl font-black tracking-tight",
          danger ? "text-rose-700" : "text-slate-900",
        ].join(" ")}
      >
        {value}
      </div>
      <div
        className={[
          "mt-2 text-xs font-semibold",
          danger ? "text-rose-600" : "text-slate-400",
        ].join(" ")}
      >
        {description}
      </div>
    </Card>
  );
}

function EmployeeMiniCard({
  employee,
  organizationById,
}: {
  employee: EmployeeRow;
  organizationById: Map<string, string>;
}) {
  return (
    <div className="rounded-2xl border border-rose-100 bg-white p-4">
      <div className="text-xs font-black text-slate-400">
        {employee.employee_code ?? "-"}
      </div>
      <div className="mt-1 text-base font-black text-slate-900">
        {employee.name ?? "-"}
      </div>
      <div className="mt-2 text-xs font-semibold text-slate-500">
        所属組織: {getOrganizationName(employee.organization_unit_id, organizationById)}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {employee.employee_code && (
          <>
            <Link
              href={`/employees/code/${encodeURIComponent(employee.employee_code)}`}
              className={buttonClassName(
                "inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:bg-slate-50"
              )}
            >
              詳細
            </Link>

            <Link
              href={`/employees/code/${encodeURIComponent(employee.employee_code)}/edit`}
              className={buttonClassName(
                "inline-flex h-8 items-center rounded-lg bg-slate-900 px-3 text-xs font-black text-white hover:bg-slate-800"
              )}
            >
              編集
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function getOrganizationName(
  organizationUnitId: string | null | undefined,
  organizationById: Map<string, string>
) {
  if (!organizationUnitId) return "未設定";

  return organizationById.get(organizationUnitId) ?? "未設定";
}

function getStatusLabel(value: string | null) {
  if (value === "active") return "在籍中";
  if (value === "leave") return "休職中";
  if (value === "inactive") return "退職・無効";
  if (!value) return "未設定";

  return value;
}