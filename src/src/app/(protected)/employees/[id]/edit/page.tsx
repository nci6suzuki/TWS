// src/app/(protected)/employees/[id]/edit/page.tsx
import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { getEmployeeEditData } from "@/lib/queries/employees";
import { EmployeeForm } from "@/components/forms/employee-form";

export default async function EmployeeEditPage({
  params,
}: {
  params: { id: string };
}) {
  const me = await requireAuth();

  if (me.role !== "admin" && me.role !== "hr") {
    redirect("/unauthorized");
  }

  const employee = await getEmployeeEditData({ me, employeeId: params.id });
  if (!employee) return notFound();

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-xl font-semibold">社員編集</h1>
      <EmployeeForm mode="edit" me={me} initialData={employee} />
    </div>
  );
}