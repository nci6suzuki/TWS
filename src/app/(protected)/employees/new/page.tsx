// src/app/(protected)/employees/new/page.tsx
import { requireAuth } from "@/lib/auth/require-auth";
import { redirect } from "next/navigation";
import { EmployeeForm } from "@/components/forms/employee-form";
import { Card, CardText, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function EmployeeNewPage() {
  const me = await requireAuth();

  if (me.role !== "admin" && me.role !== "hr") {
    redirect("/unauthorized");
  }

  const supabase = await createSupabaseServerClient();

  const [{ data: branches }, { data: departments }, { data: positions }, { data: grades }] = await Promise.all([
    supabase.from("branches").select("id, name").order("name", { ascending: true }),
    supabase.from("departments").select("id, name, branch_id").order("name", { ascending: true }),
    supabase.from("positions").select("id, name, sort_order").order("sort_order", { ascending: true }),
    supabase.from("grades").select("id, name, sort_order").order("sort_order", { ascending: true }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Card variant="elevated" style={{ padding: 0, overflow: "hidden" }}>
        <section className="rounded-2xl bg-slate-50/80 p-6 sm:p-7">
          <CardTitle style={{ fontSize: 30 }}>社員登録</CardTitle>
          <CardText style={{ marginTop: 10, fontSize: 14 }}>
            新規社員の基本情報・組織情報・育成設定を登録します。入力後は社員一覧からアカウント招待ができます。
          </CardText>
        </section>
      </Card>
      
      <EmployeeForm
        mode="create"
        me={me}
        masterOptions={{
          branches: (branches ?? []).map((item) => ({ id: item.id, name: item.name ?? "" })),
          departments: (departments ?? []).map((item) => ({
            id: item.id,
            name: item.name ?? "",
            branchId: item.branch_id ?? null,
          })),
          positions: (positions ?? []).map((item) => ({ id: item.id, name: item.name ?? "" })),
          grades: (grades ?? []).map((item) => ({ id: item.id, name: item.name ?? "" })),
        }}
      />
    </div>
  );
}