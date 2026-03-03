// src/app/(protected)/settings/templates/bulk-apply/page.tsx
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { TemplateBulkApplyForm } from "@/components/forms/template-bulk-apply-form";

export default async function TemplateBulkApplyPage() {
  const me = await requireAuth();

  if (me.role !== "admin" && me.role !== "hr") {
    redirect("/unauthorized");
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <h1 className="text-xl font-semibold">テンプレート一括適用</h1>
      <TemplateBulkApplyForm />
    </div>
  );
}