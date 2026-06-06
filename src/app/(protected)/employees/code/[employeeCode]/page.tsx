import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { getEmployeeIdByCode } from "@/lib/queries/employees";
import { getEmployeeProfileBookById } from "@/lib/queries/employee-profile";
import { EmployeeProfileBook } from "@/components/employees/employee-profile-book";

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

  const book = await getEmployeeProfileBookById(employeeId);
  if (!book) return notFound();

  return (
    <EmployeeProfileBook
      employee={book.employee}
      profile={book.profile}
      goals={book.goals}
      qualifications={book.qualifications}
      events={book.events}
      interviews={book.interviews}
      activeTab={tab}
    />
  );
}