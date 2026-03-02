// src/app/(protected)/employees/[id]/page.tsx
import { requireAuth } from "@/lib/auth/require-auth";
import { notFound } from "next/navigation";
import { getEmployeeById } from "@/lib/queries/employees";
import { EmployeeTabs } from "@/components/employees/employee-tabs";
import { EmployeeSummaryCard } from "@/components/employees/employee-summary-card";

const TAB_DEFAULT = "basic";

export default async function EmployeeDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: Record<string, string | undefined>;
}) {
  const me = await requireAuth();
  const tab = searchParams.tab ?? TAB_DEFAULT;

  const employee = await getEmployeeById({ me, employeeId: params.id });
  if (!employee) return notFound();

  return (
    <div className="space-y-4">
      <EmployeeSummaryCard me={me} employee={employee.summary} />
      <EmployeeTabs me={me} employeeId={params.id} tab={tab} />
    </div>
  );
}