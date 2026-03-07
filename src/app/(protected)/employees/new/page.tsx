// src/app/(protected)/employees/new/page.tsx
import { requireAuth } from "@/lib/auth/require-auth";
import { redirect } from "next/navigation";
import { EmployeeForm } from "@/components/forms/employee-form";
import { Card, CardText, CardTitle } from "@/components/ui/card";

export default async function EmployeeNewPage() {
  const me = await requireAuth();

  if (me.role !== "admin" && me.role !== "hr") {
    redirect("/unauthorized");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Card variant="elevated" style={{ padding: 0 }}>
        <section className="rounded-2xl p-6 sm:p-7">
          <CardTitle style={{ fontSize: 28 }}>社員登録</CardTitle>
          <CardText style={{ marginTop: 10, fontSize: 14 }}>
            新規社員の基本情報・組織情報・育成設定を登録します。入力後は社員一覧からアカウント招待ができます。
          </CardText>
        </section>
      </Card>
      
      <EmployeeForm mode="create" me={me} />
    </div>
  );
}