// src/app/(protected)/employees/new/page.tsx
import { requireAuth } from "@/lib/auth/require-auth";
import { redirect } from "next/navigation";
import { EmployeeForm } from "@/components/forms/employee-form";

export default async function EmployeeNewPage() {
  const me = await requireAuth();

  if (me.role !== "admin" && me.role !== "hr") {
    redirect("/unauthorized");
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-xl font-semibold">社員登録</h1>
      <EmployeeForm mode="create" me={me} />
    </div>
  );
}