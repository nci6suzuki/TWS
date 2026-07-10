// src/app/(protected)/settings/positions/page.tsx

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PageShell } from "@/components/ui/page-shell";
import { Hero, Card, Chip, PrimaryButton } from "@/components/ui/ux";
import { buttonClassName } from "@/lib/ui/button-class";

export const runtime = "nodejs";

type PositionMasterRow = {
  id: string;
  name: string;
  rank_order: number | null;
  is_management_role: boolean | null;
  is_active: boolean | null;
  memo: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export default async function PositionMastersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const me = await requireAuth();
  const sp = await searchParams;

  if (me.role !== "admin" && me.role !== "hr") {
    redirect("/unauthorized");
  }

  const getParam = (key: string) => {
    const v = sp[key];
    return Array.isArray(v) ? v[0] ?? "" : v ?? "";
  };

  const errorMessage = getParam("error");
  const successMessage = getParam("success");

  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("position_masters")
    .select(
      "id, name, rank_order, is_management_role, is_active, memo, created_at, updated_at"
    )
    .order("rank_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return (
      <PageShell>
        <Card className="p-6">
          <div className="text-xl font-black text-slate-900">役職マスタ</div>
          <div className="mt-2 text-sm font-semibold text-rose-600">
            役職マスタの読み込みに失敗しました：{error.message}
          </div>
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-700">
            先に Supabase SQL Editor で position_masters テーブル作成SQLを実行してください。
          </div>
        </Card>
      </PageShell>
    );
  }

  const positions = (data ?? []) as PositionMasterRow[];

  const activeCount = positions.filter((p) => p.is_active !== false).length;
  const inactiveCount = positions.filter((p) => p.is_active === false).length;
  const managementCount = positions.filter(
    (p) => p.is_management_role === true
  ).length;

  async function createPosition(formData: FormData) {
    "use server";

    const me = await requireAuth();
    if (me.role !== "admin" && me.role !== "hr") {
      redirect("/unauthorized");
    }

    const admin = createSupabaseAdminClient();

    const name = normalizeText(formData.get("name"));
    const rankOrder = normalizeNumber(formData.get("rank_order")) ?? 999;
    const isManagementRole = formData.get("is_management_role") === "on";
    const isActive = formData.get("is_active") === "on";
    const memo = normalizeText(formData.get("memo"));

    if (!name) {
      redirect(
        `/settings/positions?error=${encodeURIComponent(
          "役職名を入力してください"
        )}`
      );
    }

    const { error } = await admin.from("position_masters").insert({
      name,
      rank_order: rankOrder,
      is_management_role: isManagementRole,
      is_active: isActive,
      memo,
    });

    if (error) {
      redirect(
        `/settings/positions?error=${encodeURIComponent(error.message)}`
      );
    }

    revalidatePath("/settings/positions");
    redirect(
      `/settings/positions?success=${encodeURIComponent("役職を追加しました")}`
    );
  }

  async function updatePosition(formData: FormData) {
    "use server";

    const me = await requireAuth();
    if (me.role !== "admin" && me.role !== "hr") {
      redirect("/unauthorized");
    }

    const admin = createSupabaseAdminClient();

    const id = normalizeText(formData.get("id"));
    const name = normalizeText(formData.get("name"));
    const rankOrder = normalizeNumber(formData.get("rank_order")) ?? 999;
    const isManagementRole = formData.get("is_management_role") === "on";
    const isActive = formData.get("is_active") === "on";
    const memo = normalizeText(formData.get("memo"));

    if (!id) {
      redirect(
        `/settings/positions?error=${encodeURIComponent(
          "更新対象の役職IDが取得できませんでした"
        )}`
      );
    }

    if (!name) {
      redirect(
        `/settings/positions?error=${encodeURIComponent(
          "役職名を入力してください"
        )}`
      );
    }

    const { error } = await admin
      .from("position_masters")
      .update({
        name,
        rank_order: rankOrder,
        is_management_role: isManagementRole,
        is_active: isActive,
        memo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      redirect(
        `/settings/positions?error=${encodeURIComponent(error.message)}`
      );
    }

    revalidatePath("/settings/positions");
    redirect(
      `/settings/positions?success=${encodeURIComponent("役職を更新しました")}`
    );
  }

  return (
    <PageShell>
      <div className="space-y-6">
        <Hero
          title="役職マスタ"
          subtitle="社員登録・社員編集で使用する役職名を管理します。役職名の表記ゆれを防ぎ、役職別分析の精度を高めます。"
          meta={
            <div className="flex flex-wrap gap-2">
              <Chip tone="info">Position Masters</Chip>
              <Chip>有効: {activeCount}件</Chip>
              <Chip>停止中: {inactiveCount}件</Chip>
              <Chip>役職者扱い: {managementCount}件</Chip>
              <Chip tone="gray">閲覧/編集: admin / hr</Chip>
            </div>
          }
          right={
            <>
              <PrimaryButton href="/employees/new">社員登録へ</PrimaryButton>
              <PrimaryButton href="/employee-analytics">社員分析へ</PrimaryButton>
            </>
          }
        />

        {errorMessage && (
          <Card className="border-rose-200 bg-rose-50 p-4">
            <div className="text-sm font-black text-rose-700">
              {errorMessage}
            </div>
          </Card>
        )}

        {successMessage && (
          <Card className="border-emerald-200 bg-emerald-50 p-4">
            <div className="text-sm font-black text-emerald-700">
              {successMessage}
            </div>
          </Card>
        )}

        <Card className="p-5">
          <div className="mb-4">
            <h2 className="text-lg font-black text-slate-900">役職を追加</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              追加した役職は、社員新規登録・社員編集画面の選択肢として利用します。
            </p>
          </div>

          <form
            action={createPosition}
            className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_140px_160px_140px_1fr_auto]"
          >
            <input
              name="name"
              className="input"
              placeholder="例：課長、主任、一般社員"
              required
            />

            <input
              name="rank_order"
              type="number"
              className="input"
              placeholder="並び順"
              defaultValue={999}
            />

            <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700">
              <input name="is_management_role" type="checkbox" />
              役職者扱い
            </label>

            <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700">
              <input name="is_active" type="checkbox" defaultChecked />
              使用中
            </label>

            <input
              name="memo"
              className="input"
              placeholder="メモ 任意"
            />

            <button
              type="submit"
              className={buttonClassName(
                "inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-black text-white hover:bg-slate-800"
              )}
            >
              追加
            </button>
          </form>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-black text-slate-900">役職一覧</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              並び順が小さいほど上位に表示されます。停止中にすると、今後の選択肢から外す運用ができます。
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black text-slate-500">
                <tr>
                  <th className="px-4 py-3">役職名</th>
                  <th className="px-4 py-3">並び順</th>
                  <th className="px-4 py-3">役職者扱い</th>
                  <th className="px-4 py-3">状態</th>
                  <th className="px-4 py-3">メモ</th>
                  <th className="px-4 py-3">更新</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {positions.map((position) => (
                  <tr key={position.id}>
                    <td className="px-4 py-3">
                      <form
                        id={`position-${position.id}`}
                        action={updatePosition}
                        className="contents"
                      >
                        <input type="hidden" name="id" value={position.id} />

                        <input
                          name="name"
                          defaultValue={position.name}
                          className="input"
                          required
                        />
                      </form>
                    </td>

                    <td className="px-4 py-3">
                      <input
                        form={`position-${position.id}`}
                        name="rank_order"
                        type="number"
                        defaultValue={position.rank_order ?? 999}
                        className="input"
                      />
                    </td>

                    <td className="px-4 py-3">
                      <label className="flex items-center gap-2 text-sm font-black text-slate-700">
                        <input
                          form={`position-${position.id}`}
                          name="is_management_role"
                          type="checkbox"
                          defaultChecked={position.is_management_role === true}
                        />
                        対象
                      </label>
                    </td>

                    <td className="px-4 py-3">
                      <label className="flex items-center gap-2 text-sm font-black text-slate-700">
                        <input
                          form={`position-${position.id}`}
                          name="is_active"
                          type="checkbox"
                          defaultChecked={position.is_active !== false}
                        />
                        使用中
                      </label>
                    </td>

                    <td className="px-4 py-3">
                      <input
                        form={`position-${position.id}`}
                        name="memo"
                        defaultValue={position.memo ?? ""}
                        className="input"
                        placeholder="メモ"
                      />
                    </td>

                    <td className="px-4 py-3">
                      <button
                        form={`position-${position.id}`}
                        type="submit"
                        className={buttonClassName(
                          "inline-flex h-9 items-center justify-center rounded-xl bg-slate-900 px-4 text-xs font-black text-white hover:bg-slate-800"
                        )}
                      >
                        更新
                      </button>
                    </td>
                  </tr>
                ))}

                {positions.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm font-semibold text-slate-400"
                    >
                      役職マスタが登録されていません。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="border-amber-200 bg-amber-50 p-5">
          <div className="text-sm font-black text-amber-800">
            運用上の注意
          </div>
          <div className="mt-2 text-sm font-semibold leading-6 text-amber-700">
            すでに社員に登録済みの役職名は、すぐには自動変換されません。
            次のステップで社員新規登録・社員編集画面を役職マスタ選択式に変更します。
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

function normalizeText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function normalizeNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;

  const n = Number(text);
  if (!Number.isFinite(n)) return null;

  return Math.trunc(n);
}