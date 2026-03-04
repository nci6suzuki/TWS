// src/app/(protected)/settings/templates/[id]/edit/page.tsx
import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { getTemplateById } from "@/lib/queries/template";
import { TemplateForm } from "@/components/forms/template-form";
import { TemplateDeleteButton } from "@/components/templates/template-delete-button";

export default async function TemplateEditPage({
  params,
}: {
  params: { id: string };
}) {
  const me = await requireAuth();

  if (me.role !== "admin" && me.role !== "hr") {
    redirect("/unauthorized");
  }

  const template = await getTemplateById({ me, id: params.id });
  if (!template) return notFound();

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">テンプレート編集</h1>
        <TemplateDeleteButton templateId={params.id} />
      </div>

      <TemplateForm mode="edit" initialData={template} />
    </div>
  );
}