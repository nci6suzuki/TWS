// src/app/(protected)/settings/templates/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { getTemplates } from "@/lib/queries/templates";

export default async function TemplatesPage() {
  const me = await requireAuth();

  if (me.role !== "admin" && me.role !== "hr") {
    redirect("/unauthorized");
  }

  const items = await getTemplates({ me });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">テンプレート管理</h1>
        <div className="flex gap-2">
          <Link
            href="/settings/templates/bulk-apply"
            className="px-4 py-2 rounded border text-sm"
          >
            一括適用
          </Link>
          <Link
            href="/settings/templates/new"
            className="px-4 py-2 rounded border bg-black text-white text-sm"
          >
            新規作成
          </Link>
        </div>
      </div>

      <div className="border rounded">
        {items.length === 0 ? (
          <div className="p-4 text-sm text-gray-600">テンプレートはありません。</div>
        ) : (
          <ul>
            {items.map((item) => (
              <li key={item.id} className="p-4 border-b last:border-b-0 flex items-center justify-between">
                <div className="text-sm">
                  <div className="font-medium">{item.name}</div>
                  <div>対象職種：{item.targetJobType || "-"}</div>
                  <div>対象等級：{item.targetGrade || "-"}</div>
                  <div>状態：{item.isActive ? "有効" : "無効"}</div>
                </div>

                <Link className="underline text-sm" href={`/settings/templates/${item.id}/edit`}>
                  編集
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}