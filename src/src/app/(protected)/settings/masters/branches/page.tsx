import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { MasterSimpleManager } from "@/components/settings/master-simple-manager";

export default async function BranchMastersPage() {
  const me = await requireAuth();

  if (me.role !== "admin" && me.role !== "hr") {
    redirect("/unauthorized");
  }

  return (
    <MasterSimpleManager
      title="支店マスタ"
      fetchUrl="/api/masters/branches"
      createUrl="/api/masters/branches"
      updateUrlBase="/api/masters/branches"
      fields={[
        { key: "name", label: "支店名" },
        { key: "code", label: "コード" },
      ]}
    />
  );
}