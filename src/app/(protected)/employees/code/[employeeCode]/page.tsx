// src/app/(protected)/employees/code/[employeeCode]/page.tsx
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseServerDbClient } from "@/lib/supabase/server-db";
import { getEmployeeIdByCode } from "@/lib/queries/employees";

const TAB_DEFAULT = "basic";

export default async function EmployeeByCodePage({
  params,
  searchParams,
}: {
  params: { employeeCode: string };
  searchParams: Record<string, string | undefined>;
}) {
  await requireAuth();
  const tab = searchParams.tab ?? TAB_DEFAULT;

  const employeeId = await getEmployeeIdByCode(params.employeeCode);
  if (!employeeId) return notFound();

  const supabase = await createSupabaseServerDbClient();
  const { data: emp, error } = await supabase
    .from("employees")
    .select("id, employee_code, name, email, app_role, status")
    .eq("id", employeeId)
    .maybeSingle();

  if (error) throw error;
  if (!emp) return notFound();

  // まずは最小の詳細表示（後でProfileBook/タブに拡張）
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-6">
        <div className="text-2xl font-bold">
          {emp.name} <span className="text-slate-400">({emp.employee_code})</span>
        </div>
        <div className="mt-2 text-sm text-slate-600">{emp.email}</div>
        <div className="mt-2 text-sm text-slate-600">
          role: <b>{emp.app_role}</b> / status: <b>{emp.status}</b>
        </div>
        <div className="mt-3 text-xs text-slate-500">tab: {tab}</div>
      </div>

      <a
        href="/employees"
        className="inline-flex h-10 items-center rounded-xl border bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        ← 一覧へ戻る
      </a>
    </div>
  );
}