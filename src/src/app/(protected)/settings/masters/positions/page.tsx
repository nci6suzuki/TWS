import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { MasterSimpleManager } from "@/components/settings/master-simple-manager";

export default async function PositionMastersPage() {
  const me = await requireAuth();

  if (me.role !== "admin" && me.role !== "hr") {
    redirect("/unauthorized");
  }

  return (
    <MasterSimpleManager
      title="役職マスタ"
      fetchUrl="/api/masters/positions"
      createUrl="/api/masters/positions"
      updateUrlBase="/api/masters/positions"
      fields={[
        { key: "name", label: "役職名" },
        { key: "sort_order", label: "表示順", type: "number" },
      ]}
    />
  );
}