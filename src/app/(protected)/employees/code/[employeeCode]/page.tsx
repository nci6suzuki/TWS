import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { getEmployeeProfileBookByCode } from "@/lib/queries/employee-profile";
import { EmployeeProfileBook } from "@/components/employees/employee-profile-book";
import { PageShell } from "@/components/ui/page-shell";
import { Hero, Card, Chip, GhostButton } from "@/components/ui/ux";

const TAB_DEFAULT = "basic";

export default async function EmployeeByCodePage({
  params,
  searchParams,
}: {
  params: Promise<{ employeeCode: string }>;
  searchParams: Record<string, string | undefined>;
}) {
  await requireAuth();

  const { employeeCode } = await params;
  const tab = searchParams.tab ?? TAB_DEFAULT;

  const book = await getEmployeeProfileBookByCode(employeeCode);
  if (!book) return notFound();

  const employee = book.employee;

  return (
    <PageShell>
      <Hero
        title={employee.name ?? "社員カルテ"}
        subtitle="基本情報、キャリア希望、資格、年間イベント、面談履歴を確認できます。"
        meta={
          <div className="flex flex-wrap gap-2">
            <Chip tone="info">Employee Profile</Chip>
            <Chip>社員番号: {employee.employee_code}</Chip>
            {employee.status && (
              <Chip tone={employee.status === "active" ? "ok" : "gray"}>
                状態: {employee.status}
              </Chip>
            )}
            {employee.app_role && <Chip>権限: {employee.app_role}</Chip>}
            <Chip>表示タブ: {tab}</Chip>
          </div>
        }
        right={
          <>
            <GhostButton href="/employees">社員一覧へ戻る</GhostButton>
          </>
        }
      />

      <Card className="overflow-hidden">
        <EmployeeProfileBook
          employee={book.employee}
          profile={book.profile}
          goals={book.goals}
          qualifications={book.qualifications}
          events={book.events}
          interviews={book.interviews}
          activeTab={tab}
        />
      </Card>
    </PageShell>
  );
}