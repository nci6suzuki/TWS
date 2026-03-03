import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { TemplateForm } from "@/components/forms/template-form";

export default async function TemplateNewPage() {
  const me = await requireAuth();

  if (me.role !== "admin" && me.role !== "hr") {
    redirect("/unauthorized");
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <h1 className="text-xl font-semibold">テンプレート新規作成</h1>
      <TemplateForm mode="create" />
    </div>
  );
}