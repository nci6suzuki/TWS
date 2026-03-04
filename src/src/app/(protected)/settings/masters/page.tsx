import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";

const items = [
  { href: "/settings/masters/branches", label: "支店マスタ" },
  { href: "/settings/masters/departments", label: "部署マスタ" },
  { href: "/settings/masters/positions", label: "役職マスタ" },
  { href: "/settings/masters/grades", label: "等級マスタ" },
  { href: "/settings/masters/qualifications", label: "資格マスタ" },
  { href: "/settings/templates", label: "年間テンプレート" },
  { href: "/settings/audit-logs", label: "監査ログ" },
];

export default async function MastersPage() {
  const me = await requireAuth();

  if (me.role !== "admin" && me.role !== "hr") {
    redirect("/unauthorized");
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-xl font-semibold">マスタ管理</h1>

      <div className="border rounded">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block p-4 border-b last:border-b-0 hover:bg-gray-50"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}