import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { MasterSimpleManager } from "@/components/settings/master-simple-manager";
import { PageContainer } from "@/components/layout/page-container";

export default async function GradeMastersPage() {
  const me = await requireAuth();

  if (me.role !== "admin" && me.role !== "hr") {
    redirect("/unauthorized");
  }

  return (
    <PageContainer size="xl">
    <MasterSimpleManager
      title="等級マスタ"
      fetchUrl="/api/masters/grades"
      createUrl="/api/masters/grades"
      updateUrlBase="/api/masters/grades"
      fields={[
        { key: "name", label: "等級名" },
        { key: "sort_order", label: "表示順", type: "number" },
      ]}
    />
    </PageContainer>
  );
}