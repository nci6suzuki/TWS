import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { DepartmentMasterManager } from "@/components/settings/department-master-manager";

export default async function DepartmentMastersPage() {
  const me = await requireAuth();

  if (me.role !== "admin" && me.role !== "hr") {
    redirect("/unauthorized");
  }

  return <DepartmentMasterManager />;
}