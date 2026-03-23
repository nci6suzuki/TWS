// src/app/(protected)/employees/[id]/page.tsx
import { requireAuth } from "@/lib/auth/require-auth";
import { notFound } from "next/navigation";
import { getEmployeeById } from "@/lib/queries/employees";
import { EmployeeProfileBook } from "@/components/employees/employee-profile-book";

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

  return <EmployeeProfileBook me={me} employeeId={params.id} tab={tab} summary={employee.summary} />;
}