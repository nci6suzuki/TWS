// src/app/(protected)/notifications/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PageShell } from "@/components/ui/page-shell";
import { Hero, Card, Chip, KPI, PrimaryButton } from "@/components/ui/ux";

export const runtime = "nodejs";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const me = await requireAuth();

  if (me.role !== "admin" && me.role !== "hr") {
    redirect("/unauthorized");
  }

  const sp = await searchParams;

  const getParam = (key: string) => {
    const v = sp[key];
    return Array.isArray(v) ? v[0] ?? "" : v ?? "";
  };

  const status = getParam("status") || "unread";
  const severity = getParam("severity");
  const errorMessage = getParam("error");

  const admin = createSupabaseAdminClient();

  let query = admin
    .from("notifications")
    .select(
      "id, employee_id, title, message, notification_type, severity, status, due_date, related_type, related_id, created_at, read_at"
    )
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(300);

  if (status !== "all") {
    query = query.eq("status", status);
  }

  if (severity) {
    query = query.eq("severity", severity);
  }

  const { data: notifications, error } = await query;

  if (error) throw error;

  const employeeIds = Array.from(
    new Set((notifications ?? []).map((n) => n.employee_id).filter(Boolean))
  );

  const { data: employees } =
    employeeIds.length > 0
      ? await admin
          .from("employees")
          .select("id, employee_code, name, email")
          .in("id", employeeIds)
      : { data: [] as any[] };

  const employeeById = new Map((employees ?? []).map((e: any) => [e.id, e]));

  const all = notifications ?? [];
  const unreadCount = all.filter((n) => n.status === "unread").length;
  const dangerCount = all.filter((n) => n.severity === "danger").length;
  const warningCount = all.filter((n) => n.severity === "warning").length;
  const infoCount = all.filter((n) => n.severity === "info").length;

  async function markAsRead(formData: FormData) {
    "use server";

    const me = await requireAuth();

    if (me.role !== "admin" && me.role !== "hr") {
      redirect("/unauthorized");
    }

    const id = String(formData.get("id") ?? "");
    const admin = createSupabaseAdminClient();

    const { error } = await admin
      .from("notifications")
      .update({
        status: "read",
        read_at: new Date().toISOString(),
        read_by_employee_id: me.employeeId,
      })
      .eq("id", id);

    if (error) {
      redirect(`/notifications?error=${encodeURIComponent(error.message)}`);
    }

    redirect("/notifications");
  }

  async function markAllAsRead() {
    "use server";

    const me = await requireAuth();

    if (me.role !== "admin" && me.role !== "hr") {
      redirect("/unauthorized");
    }

    const admin = createSupabaseAdminClient();

    const { error } = await admin
      .from("notifications")
      .update({
        status: "read",
        read_at: new Date().toISOString(),
        read_by_employee_id: me.employeeId,
      })
      .eq("status", "unread");

    if (error) {
      redirect(`/notifications?error=${encodeURIComponent(error.message)}`);
    }

    redirect("/notifications");
  }

  return (
    <PageShell>
      <div className="space-y-6">
        <Hero
          title="通知・リマインド"
          subtitle="資格期限、年間イベント、期限超過などの要対応事項を通知として確認できます。"
          meta={
            <div className="flex flex-wrap gap-2">
              <Chip tone="info">Notifications</Chip>
              <Chip>表示件数: {all.length}</Chip>
              <Chip>状態: {status}</Chip>
              {severity && <Chip>重要度: {severity}</Chip>}
            </div>
          }
          right={
            <>
              <PrimaryButton href="/notifications">未読</PrimaryButton>
              <PrimaryButton href="/notifications?status=all">
                すべて
              </PrimaryButton>
              <PrimaryButton href="/notifications?severity=danger">
                重要
              </PrimaryButton>

              <form action={markAllAsRead}>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-4 text-sm font-black text-white hover:bg-slate-800"
                >
                  すべて既読
                </button>
              </form>
            </>
          }
        />

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

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <KPI
            label="未読"
            value={unreadCount}
            tone={unreadCount > 0 ? "danger" : "ok"}
          />
          <KPI
            label="重要"
            value={dangerCount}
            tone={dangerCount > 0 ? "danger" : "ok"}
          />
          <KPI
            label="注意"
            value={warningCount}
            tone={warningCount > 0 ? "danger" : "ok"}
          />
          <KPI label="情報" value={infoCount} tone="ok" />
        </div>

        <Card className="p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                通知を最新化
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                資格期限・年間イベントの状態を確認して通知を生成します。
              </p>
            </div>

            <form action="/api/notifications/generate" method="post">
              <button
                type="submit"
                className="inline-flex h-11 items-center rounded-xl bg-indigo-600 px-5 text-sm font-black text-white hover:bg-indigo-700"
              >
                通知を生成・更新
              </button>
            </form>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-black text-slate-900">通知一覧</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              「開いて既読」を押すと、通知を既読にしてから関連ページへ移動します。
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {all.length === 0 ? (
              <div className="p-8 text-center text-sm font-bold text-slate-500">
                表示できる通知はありません
              </div>
            ) : (
              all.map((n) => {
                const employee = employeeById.get(n.employee_id);
                const href = getNotificationHref(n, employee);
                const readAndOpenHref = `/api/notifications/${
                  n.id
                }/read-and-redirect?to=${encodeURIComponent(href)}`;

                return (
                  <div
                    key={n.id}
                    className={[
                      "p-5",
                      n.status === "unread" ? "bg-white" : "bg-slate-50",
                    ].join(" ")}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                          <Chip tone={getSeverityTone(n.severity)}>
                            {getSeverityLabel(n.severity)}
                          </Chip>

                          <Chip tone={n.status === "unread" ? "info" : "gray"}>
                            {n.status === "unread" ? "未読" : "既読"}
                          </Chip>

                          {n.due_date && <Chip>期限: {n.due_date}</Chip>}

                          {employee && (
                            <Chip tone="info">
                              {employee.employee_code} / {employee.name}
                            </Chip>
                          )}
                        </div>

                        <Link
                          href={href}
                          className="mt-3 block text-lg font-black text-slate-900 hover:underline"
                        >
                          {n.title}
                        </Link>

                        <div className="mt-2 whitespace-pre-wrap text-sm font-semibold text-slate-600">
                          {n.message || "-"}
                        </div>

                        <div className="mt-3 text-xs font-semibold text-slate-400">
                          作成日時: {formatDateTime(n.created_at)}
                          {n.read_at && ` / 既読日時: ${formatDateTime(n.read_at)}`}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={href}
                          className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
                        >
                          関連ページへ
                        </Link>

                        {n.status === "unread" && (
                          <Link
                            href={readAndOpenHref}
                            className="inline-flex h-9 items-center rounded-xl bg-indigo-600 px-4 text-sm font-black text-white hover:bg-indigo-700"
                          >
                            開いて既読
                          </Link>
                        )}

                        {n.status === "unread" && (
                          <form action={markAsRead}>
                            <input type="hidden" name="id" value={n.id} />
                            <button
                              type="submit"
                              className="inline-flex h-9 items-center rounded-xl bg-slate-900 px-4 text-sm font-black text-white hover:bg-slate-800"
                            >
                              既読にする
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

function getSeverityTone(severity: string) {
  if (severity === "danger") return "danger";
  if (severity === "warning") return "danger";
  if (severity === "info") return "info";
  return "gray";
}

function getSeverityLabel(severity: string) {
  if (severity === "danger") return "重要";
  if (severity === "warning") return "注意";
  if (severity === "info") return "情報";
  return severity || "通常";
}

function getNotificationHref(n: any, employee: any) {
  if (n.related_type === "employee_annual_event" && n.related_id) {
    return `/annual-events/${n.related_id}`;
  }

  if (n.related_type === "employee_qualification" && employee?.employee_code) {
    return `/employees/code/${employee.employee_code}?tab=qualifications`;
  }

  if (employee?.employee_code) {
    return `/employees/code/${employee.employee_code}?tab=timeline`;
  }

  return "/notifications";
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  return d.toLocaleString("ja-JP");
}