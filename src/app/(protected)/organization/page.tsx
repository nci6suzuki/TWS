// src/app/(protected)/organization/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PageShell } from "@/components/ui/page-shell";
import { Hero, Card, Chip, KPI, PrimaryButton, GhostButton } from "@/components/ui/ux";
import { OrganizationTree } from "@/components/organization/organization-tree";

export const runtime = "nodejs";

export default async function OrganizationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const me = await requireAuth();

  if (me.role !== "admin" && me.role !== "hr" && me.role !== "manager") {
    redirect("/unauthorized");
  }

  const sp = await searchParams;

  const getParam = (key: string) => {
    const v = sp[key];
    return Array.isArray(v) ? v[0] ?? "" : v ?? "";
  };

  const errorMessage = getParam("error");
  const created = getParam("created");
  const updated = getParam("updated");
  const deleted = getParam("deleted");
  const assigned = getParam("assigned");

  const canManage = me.role === "admin" || me.role === "hr";

  const admin = createSupabaseAdminClient();

  const { data: units, error: unitsError } = await admin
    .from("organization_units")
    .select("id, name, parent_id, sort_order, is_active, created_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (unitsError) throw unitsError;

  const { data: employees, error: employeesError } = await admin
    .from("employees")
    .select("id, employee_code, name, email, app_role, status, organization_unit_id, manager_employee_id")
    .order("employee_code", { ascending: true })
    .limit(5000);

  if (employeesError) throw employeesError;

  const safeUnits = units ?? [];
  const safeEmployees = employees ?? [];

  const assignedCount = safeEmployees.filter((e) => e.organization_unit_id).length;
  const unassignedCount = safeEmployees.filter((e) => !e.organization_unit_id).length;
  const activeUnitCount = safeUnits.filter((u) => u.is_active).length;

  async function createUnit(formData: FormData) {
    "use server";

    const me = await requireAuth();

    if (me.role !== "admin" && me.role !== "hr") {
      redirect("/unauthorized");
    }

    const admin = createSupabaseAdminClient();

    const name = String(formData.get("name") ?? "").trim();
    const parentId = String(formData.get("parent_id") ?? "").trim();
    const sortOrder = Number(formData.get("sort_order") ?? 100);

    if (!name) {
      redirect(`/organization?error=${encodeURIComponent("組織名を入力してください")}`);
    }

    const { error } = await admin.from("organization_units").insert({
      name,
      parent_id: parentId || null,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 100,
      is_active: true,
    });

    if (error) {
      redirect(`/organization?error=${encodeURIComponent(error.message)}`);
    }

    redirect(`/organization?created=${encodeURIComponent(name)}`);
  }

  async function updateUnit(formData: FormData) {
    "use server";

    const me = await requireAuth();

    if (me.role !== "admin" && me.role !== "hr") {
      redirect("/unauthorized");
    }

    const admin = createSupabaseAdminClient();

    const id = String(formData.get("id") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const parentId = String(formData.get("parent_id") ?? "").trim();
    const sortOrder = Number(formData.get("sort_order") ?? 100);
    const isActive = String(formData.get("is_active") ?? "true") === "true";

    if (!id) {
      redirect(`/organization?error=${encodeURIComponent("更新対象がありません")}`);
    }

    if (!name) {
      redirect(`/organization?error=${encodeURIComponent("組織名を入力してください")}`);
    }

    if (parentId && parentId === id) {
      redirect(`/organization?error=${encodeURIComponent("自分自身を親組織にはできません")}`);
    }

    const { error } = await admin
      .from("organization_units")
      .update({
        name,
        parent_id: parentId || null,
        sort_order: Number.isFinite(sortOrder) ? sortOrder : 100,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      redirect(`/organization?error=${encodeURIComponent(error.message)}`);
    }

    redirect(`/organization?updated=${encodeURIComponent(name)}`);
  }

  async function deleteUnit(formData: FormData) {
    "use server";

    const me = await requireAuth();

    if (me.role !== "admin" && me.role !== "hr") {
      redirect("/unauthorized");
    }

    const admin = createSupabaseAdminClient();

    const id = String(formData.get("id") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();

    if (!id) {
      redirect(`/organization?error=${encodeURIComponent("削除対象がありません")}`);
    }

    const { error: clearEmployeeError } = await admin
      .from("employees")
      .update({ organization_unit_id: null })
      .eq("organization_unit_id", id);

    if (clearEmployeeError) {
      redirect(`/organization?error=${encodeURIComponent(clearEmployeeError.message)}`);
    }

    const { error } = await admin.from("organization_units").delete().eq("id", id);

    if (error) {
      redirect(`/organization?error=${encodeURIComponent(error.message)}`);
    }

    redirect(`/organization?deleted=${encodeURIComponent(name || "組織")}`);
  }

async function assignEmployee(formData: FormData) {
  "use server";

  const me = await requireAuth();

  if (me.role !== "admin" && me.role !== "hr") {
    redirect("/unauthorized");
  }

  const admin = createSupabaseAdminClient();

  const employeeId = String(formData.get("employee_id") ?? "").trim();
  const organizationUnitId = String(
    formData.get("organization_unit_id") ?? ""
  ).trim();
  const managerEmployeeId = String(
    formData.get("manager_employee_id") ?? ""
  ).trim();

  if (!employeeId) {
    redirect(`/organization?error=${encodeURIComponent("社員を選択してください")}`);
  }

  if (managerEmployeeId && managerEmployeeId === employeeId) {
    redirect(
      `/organization?error=${encodeURIComponent(
        "自分自身を上司に設定することはできません"
      )}`
    );
  }

  const { error } = await admin
    .from("employees")
    .update({
      organization_unit_id: organizationUnitId || null,
      manager_employee_id: managerEmployeeId || null,
    })
    .eq("id", employeeId);

  if (error) {
    redirect(`/organization?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/organization?assigned=1`);
}

  return (
    <PageShell>
      <div className="space-y-6">
        <Hero
          title="シナプスツリー"
          subtitle="部署・役職・チームを階層で管理し、社員の所属を視覚的に確認できます。"
          meta={
            <div className="flex flex-wrap gap-2">
              <Chip tone="info">Organization Tree</Chip>
              <Chip>組織数: {safeUnits.length}</Chip>
              <Chip>社員数: {safeEmployees.length}</Chip>
              <Chip>権限: {me.role}</Chip>
            </div>
          }
          right={
            <>
              <GhostButton href="/employees">社員一覧</GhostButton>
              <PrimaryButton href="/organization">最新表示</PrimaryButton>
            </>
          }
        />

        {errorMessage && (
          <Card className="border-rose-200 bg-rose-50 p-5">
            <div className="text-sm font-black text-rose-700">エラー</div>
            <div className="mt-1 text-sm font-semibold text-rose-600">
              {errorMessage}
            </div>
          </Card>
        )}

        {created && (
          <Card className="border-emerald-200 bg-emerald-50 p-5">
            <div className="text-sm font-black text-emerald-700">組織を追加しました</div>
            <div className="mt-1 text-sm font-semibold text-emerald-600">
              「{created}」を追加しました。
            </div>
          </Card>
        )}

        {updated && (
          <Card className="border-emerald-200 bg-emerald-50 p-5">
            <div className="text-sm font-black text-emerald-700">組織を更新しました</div>
            <div className="mt-1 text-sm font-semibold text-emerald-600">
              「{updated}」を更新しました。
            </div>
          </Card>
        )}

        {deleted && (
          <Card className="border-amber-200 bg-amber-50 p-5">
            <div className="text-sm font-black text-amber-700">組織を削除しました</div>
            <div className="mt-1 text-sm font-semibold text-amber-600">
              「{deleted}」を削除しました。
            </div>
          </Card>
        )}

        {assigned && (
          <Card className="border-emerald-200 bg-emerald-50 p-5">
            <div className="text-sm font-black text-emerald-700">所属を更新しました</div>
            <div className="mt-1 text-sm font-semibold text-emerald-600">
              社員の所属組織を更新しました。
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <KPI label="組織数" value={safeUnits.length} />
          <KPI label="有効組織" value={activeUnitCount} tone="ok" />
          <KPI label="所属設定済" value={assignedCount} tone="ok" />
          <KPI
            label="未所属"
            value={unassignedCount}
            tone={unassignedCount > 0 ? "danger" : "ok"}
          />
        </div>

        <OrganizationTree units={safeUnits} employees={safeEmployees} />

        {canManage && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card className="p-5">
              <h2 className="text-lg font-black text-slate-900">組織を追加</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                親組織を選ぶと、その配下にボックスが表示されます。
              </p>

              <form action={createUnit} className="mt-5 space-y-4">
                <label className="block">
                  <div className="mb-1 text-sm font-black text-slate-700">
                    組織名
                  </div>
                  <input
                    className="input"
                    name="name"
                    placeholder="例：人事・総務課"
                    required
                  />
                </label>

                <label className="block">
                  <div className="mb-1 text-sm font-black text-slate-700">
                    親組織
                  </div>
                  <select className="input" name="parent_id" defaultValue="">
                    <option value="">最上位に追加</option>
                    {safeUnits.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <div className="mb-1 text-sm font-black text-slate-700">
                    並び順
                  </div>
                  <input
                    className="input"
                    type="number"
                    name="sort_order"
                    defaultValue={100}
                  />
                </label>

                <button
                  type="submit"
                  className="inline-flex h-11 items-center rounded-xl bg-slate-900 px-5 text-sm font-black text-white hover:bg-slate-800"
                >
                  追加する
                </button>
              </form>
            </Card>

            <Card className="p-5">
              <h2 className="text-lg font-black text-slate-900">社員の所属を設定</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                社員を選択して、所属する部署・チームに紐づけます。
              </p>

              <form action={assignEmployee} className="mt-5 space-y-4">
                <label className="block">
                  <div className="mb-1 text-sm font-black text-slate-700">
                    社員
                  </div>
                  <select className="input" name="employee_id" defaultValue="">
                    <option value="">社員を選択</option>
                    {safeEmployees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.employee_code} / {employee.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <div className="mb-1 text-sm font-black text-slate-700">
                    所属組織
                  </div>
                  <select className="input" name="organization_unit_id" defaultValue="">
                    <option value="">未所属にする</option>
                    {safeUnits.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
                </label>

<label className="block">
  <div className="mb-1 text-sm font-black text-slate-700">
    直属上司
  </div>
  <select className="input" name="manager_employee_id" defaultValue="">
    <option value="">上司なし</option>
    {safeEmployees.map((employee) => (
      <option key={employee.id} value={employee.id}>
        {employee.employee_code} / {employee.name}
      </option>
    ))}
  </select>
</label>

                <button
                  type="submit"
                  className="inline-flex h-11 items-center rounded-xl bg-indigo-600 px-5 text-sm font-black text-white hover:bg-indigo-700"
                >
                  所属を更新
                </button>
              </form>
            </Card>
          </div>
        )}

        {canManage && (
          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-black text-slate-900">組織一覧・編集</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                名称、親組織、並び順、有効状態を変更できます。
              </p>
            </div>

            <div className="overflow-auto">
              <table className="min-w-[1000px] w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="px-4 py-3 text-left font-black">組織名</th>
                    <th className="px-4 py-3 text-left font-black">親組織</th>
                    <th className="px-4 py-3 text-left font-black">並び順</th>
                    <th className="px-4 py-3 text-left font-black">状態</th>
                    <th className="px-4 py-3 text-left font-black">人数</th>
                    <th className="px-4 py-3 text-left font-black">操作</th>
                  </tr>
                </thead>

                <tbody>
                  {safeUnits.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-sm font-bold text-slate-500"
                      >
                        組織がまだ登録されていません
                      </td>
                    </tr>
                  ) : (
                    safeUnits.map((unit) => {
                      const memberCount = safeEmployees.filter(
                        (e) => e.organization_unit_id === unit.id
                      ).length;

                      return (
                        <tr
                          key={unit.id}
                          className="border-b border-slate-100 bg-white hover:bg-slate-50"
                        >
                          <td className="px-4 py-3">
                            <form action={updateUnit} className="flex gap-2">
                              <input type="hidden" name="id" value={unit.id} />
                              <input className="input" name="name" defaultValue={unit.name} />
                          </form>
                          </td>

                          <td className="px-4 py-3">
                            <form id={`unit-${unit.id}`} action={updateUnit} className="contents">
                              <input type="hidden" name="id" value={unit.id} />
                              <input type="hidden" name="name" value={unit.name} />
                              <select className="input" name="parent_id" defaultValue={unit.parent_id ?? ""}>
                                <option value="">最上位</option>
                                {safeUnits
                                  .filter((u) => u.id !== unit.id)
                                  .map((u) => (
                                    <option key={u.id} value={u.id}>
                                      {u.name}
                                    </option>
                                  ))}
                              </select>
                            </form>
                          </td>

                          <td className="px-4 py-3">
                            <input
                              form={`unit-${unit.id}`}
                              className="input w-24"
                              type="number"
                              name="sort_order"
                              defaultValue={unit.sort_order}
                            />
                          </td>

                          <td className="px-4 py-3">
                            <select
                              form={`unit-${unit.id}`}
                              className="input"
                              name="is_active"
                              defaultValue={String(unit.is_active)}
                            >
                              <option value="true">有効</option>
                              <option value="false">無効</option>
                            </select>
                          </td>

                          <td className="px-4 py-3">
                            <Chip tone={memberCount > 0 ? "info" : "gray"}>
                              {memberCount}名
                            </Chip>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <button
                                form={`unit-${unit.id}`}
                                type="submit"
                                className="inline-flex h-8 items-center rounded-lg bg-slate-900 px-3 text-xs font-black text-white hover:bg-slate-800"
                              >
                                更新
                              </button>

                              <form action={deleteUnit}>
                                <input type="hidden" name="id" value={unit.id} />
                                <input type="hidden" name="name" value={unit.name} />
                                <button
                                  type="submit"
                                  className="inline-flex h-8 items-center rounded-lg bg-rose-600 px-3 text-xs font-black text-white hover:bg-rose-700"
                                >
                                  削除
                                </button>
                              </form>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </PageShell>
  );
}