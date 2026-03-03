import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { MasterSimpleManager } from "@/components/settings/master-simple-manager";

export default async function QualificationMastersPage() {
  const me = await requireAuth();

  if (me.role !== "admin" && me.role !== "hr") {
    redirect("/unauthorized");
  }

  return (
    <MasterSimpleManager
      title="資格マスタ"
      fetchUrl="/api/masters/qualifications"
      createUrl="/api/masters/qualifications"
      updateUrlBase="/api/masters/qualifications"
      fields={[
        { key: "name", label: "資格名" },
        { key: "category", label: "カテゴリ" },
      ]}
    />
  );
}