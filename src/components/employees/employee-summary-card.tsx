import { EmployeeSummary, Me } from "@/types/api";

export function EmployeeSummaryCard({
  me,
  employee,
}: {
  me: Me;
  employee: EmployeeSummary;
}) {
  void me;
  return (
    <section className="border rounded p-4 space-y-1">
      <h2 className="text-lg font-semibold">{employee.name}</h2>
      <p className="text-sm text-gray-600">社員番号: {employee.employeeCode}</p>
      <p className="text-sm text-gray-600">支店: {employee.branchName}</p>
    </section>
  );
}