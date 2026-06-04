// src/app/(protected)/employees/code/[employeeCode]/page.tsx
import { requireAuth } from "@/lib/auth/require-auth";
import { notFound } from "next/navigation";
import { getEmployeeById, getEmployeeIdByCode } from "@/lib/queries/employees";
import { EmployeeProfileBook } from "@/components/employees/employee-profile-book";
import { PageContainer } from "@/components/layout/page-container";

const TAB_DEFAULT = "basic";

export default async function EmployeeByCodePage({
  params,
  searchParams,
}: {
  params: { employeeCode: string };
  searchParams: Record<string, string | undefined>;
}) {
  const me = await requireAuth();
  const tab = searchParams.tab ?? TAB_DEFAULT;

  // ① 社員番号 → UUID に変換
  const employeeId = await getEmployeeIdByCode({ me, employeeCode: params.employeeCode });
  if (!employeeId) return notFound();

  // ② 既存の UUID 用クエリで取得（権限チェックもここで効く）
  const employee = await getEmployeeById({ me, employeeId });
  if (!employee) return notFound();

  // ③ 既存の表示コンポーネントをそのまま使う（内部はUUIDでOK）
  return (
      <PageContainer size="xl">
    <EmployeeProfileBook
      me={me}
      employeeId={employeeId}
      tab={tab}
      summary={employee.summary}
    />
      </PageContainer>
  );
}