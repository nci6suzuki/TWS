// src/app/(protected)/employees/[id]/page.tsx
import { requireAuth } from "@/lib/auth/require-auth";
import { notFound, redirect } from "next/navigation";
import { getEmployeeById } from "@/lib/queries/employees";
import { EmployeeProfileBook } from "@/components/employees/employee-profile-book";
import { PageContainer } from "@/components/layout/v2/page";

const TAB_DEFAULT = "basic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export default async function EmployeeDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: Record<string, string | undefined>;
}) {
  const me = await requireAuth();
  const tab = searchParams.tab ?? TAB_DEFAULT;

  // 社員番号っぽい値が来たら正規URLへ
  if (!isUuid(params.id)) {
    redirect(`/employees/code/${params.id}?tab=${tab}`);
  }

  const employee = await getEmployeeById({ me, employeeId: params.id });
  if (!employee) return notFound();

  return (
    <PageContainer size="xl">
      <EmployeeProfileBook
        me={me}
        employeeId={params.id}
        tab={tab}
        summary={employee.summary}
      />
    </PageContainer>
  );
}