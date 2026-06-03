import { requireAuth } from "@/lib/auth/require-auth";
import { notFound } from "next/navigation";
import { getEmployeeById, getEmployeeIdByCode } from "@/lib/queries/employees";
import { EmployeeProfileBook } from "@/components/employees/employee-profile-book";

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

  // 社員番号 → UUID
  const employeeId = await getEmployeeIdByCode({ me, employeeCode: params.employeeCode });
  if (!employeeId) return notFound();

  const employee = await getEmployeeById({ me, employeeId });
  if (!employee) return notFound();

  return (
    <EmployeeProfileBook
      me={me}
      employeeId={employeeId}
      tab={tab}
      summary={employee.summary}
    />
  );
}