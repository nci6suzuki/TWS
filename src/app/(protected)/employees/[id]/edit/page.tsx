// src/app/(protected)/employees/[id]/edit/page.tsx
import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { getEmployeeEditData } from "@/lib/queries/employees";
import { EmployeeForm } from "@/components/forms/employee-form";
import { Card, CardText, CardTitle } from "@/components/ui/card";

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
    <div className="space-y-5 max-w-3xl">
      <Card variant="elevated" style={{ padding: 0, overflow: "hidden" }}>
        <section style={{ padding: 24, background: "#f8fafc" }}>
          <CardTitle style={{ fontSize: 28 }}>社員編集</CardTitle>
          <CardText style={{ marginTop: 10, fontSize: 14 }}>
            社員情報の更新を行います。保存後は社員一覧や詳細画面へ反映されます。
          </CardText>
        </section>
      </Card>
      <EmployeeForm mode="edit" me={me} initialData={employee} />
    </div>
  );
}