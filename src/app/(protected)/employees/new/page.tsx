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
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">社員登録</h1>
        <p className="text-sm text-slate-600">新規社員の基本情報、組織情報、初期設定を登録します。</p>
      </div>
      <EmployeeForm mode="create" me={me} />
    </div>
  );
}