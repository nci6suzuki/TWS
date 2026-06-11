// src/app/(protected)/annual-events/new/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PageShell } from "@/components/ui/page-shell";
import { Card, Chip } from "@/components/ui/ux";
import { AnnualEventTemplateForm } from "@/components/annual-events/annual-event-template-form";

export const runtime = "nodejs";

export default async function AnnualEventNewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const me = await requireAuth();
  const sp = await searchParams;

  if (me.role !== "admin" && me.role !== "hr") {
    redirect("/unauthorized");
  }

  const errorParam = sp.error;
  const errorMessage = Array.isArray(errorParam)
    ? errorParam[0] ?? ""
    : errorParam ?? "";

  // 社員カルテから /annual-events/new?employeeCode=000101 で来た場合に使う
  const employeeCodeParam = sp.employeeCode;
  const defaultEmployeeCode = Array.isArray(employeeCodeParam)
    ? employeeCodeParam[0] ?? ""
    : employeeCodeParam ?? "";

  const admin = createSupabaseAdminClient();

  const { data: employees, error: employeesError } = await admin
    .from("employees")
    .select("id, employee_code, name, email, status")
    .order("employee_code", { ascending: true })
    .limit(500);

  if (employeesError) throw employeesError;

  const defaultEmployee = defaultEmployeeCode
    ? (employees ?? []).find((e) => e.employee_code === defaultEmployeeCode)
    : null;

  const defaultEmployeeId = defaultEmployee?.id ?? "";

  async function createAnnualEvent(formData: FormData) {
    "use server";

    const me = await requireAuth();

    if (me.role !== "admin" && me.role !== "hr") {
      redirect("/unauthorized");
    }

    const admin = createSupabaseAdminClient();

    const employeeId = String(formData.get("employee_id") ?? "").trim();
    const title = String(formData.get("title") ?? "").trim();
    const eventType = String(formData.get("event_type") ?? "other").trim();
    const scheduledDate = String(formData.get("scheduled_date") ?? "").trim();
    const priorityRaw = String(formData.get("priority") ?? "2").trim();
    const description = String(formData.get("description") ?? "").trim();

    const priority = Number(priorityRaw || 2);

    if (!employeeId) {
      redirect(
        `/annual-events/new?error=${encodeURIComponent(
          "対象社員を選択してください"
        )}`
      );
    }

    if (!title || !scheduledDate) {
      redirect(
        `/annual-events/new?error=${encodeURIComponent(
          "タイトルと予定日は必須です"
        )}`
      );
    }

    const { data: employee, error: employeeError } = await admin
      .from("employees")
      .select("id")
      .eq("id", employeeId)
      .maybeSingle();

    if (employeeError || !employee) {
      redirect(
        `/annual-events/new?error=${encodeURIComponent(
          employeeError?.message ?? "対象社員が見つかりません"
        )}`
      );
    }

    const { error } = await admin.from("employee_annual_events").insert({
      employee_id: employeeId,
      title,
      event_type: eventType,
      scheduled_date: scheduledDate,
      status: "pending",
      priority,
      description,
    });

    if (error) {
      redirect(`/annual-events/new?error=${encodeURIComponent(error.message)}`);
    }

    redirect("/annual-events");
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <Card className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-xs font-black tracking-[0.18em] text-indigo-600">
                NEW ANNUAL EVENT
              </div>
              <h1 className="mt-2 text-3xl font-black text-slate-900">
                年間イベント登録
              </h1>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                面談、評価、研修、資格更新など、社員ごとの予定を登録します。
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Chip tone="info">admin/hr only</Chip>

              {defaultEmployee && (
                <Chip tone="info">
                  対象: {defaultEmployee.employee_code} / {defaultEmployee.name}
                </Chip>
              )}

              <Link
                href="/annual-events"
                className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
              >
                一覧へ戻る
              </Link>
            </div>
          </div>
        </Card>

        {errorMessage && (
          <Card className="border-rose-200 bg-rose-50 p-5">
            <div className="text-sm font-black text-rose-700">
              エラーが発生しました
            </div>
            <div className="mt-1 text-sm font-semibold text-rose-600">
              {errorMessage}
            </div>
          </Card>
        )}

        <form action={createAnnualEvent} className="space-y-6">
          <AnnualEventTemplateForm
            employees={(employees ?? []).map((e) => ({
              id: e.id,
              employee_code: e.employee_code,
              name: e.name,
              email: e.email,
              status: e.status,
            }))}
            today={today}
            defaultEmployeeId={defaultEmployeeId}
          />

          <div className="flex flex-col gap-3 md:flex-row md:justify-end">
            <Link
              href="/annual-events"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              キャンセル
            </Link>

            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-6 text-sm font-black text-white hover:bg-slate-800"
            >
              登録する
            </button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}