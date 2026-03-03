import Link from "next/link";
import { Me } from "@/types/api";

export function AppSidebar({ me }: { me: Me }) {
  return (
    <aside className="w-56 border-r p-4 space-y-2">
      <div className="text-sm text-gray-500">{me.employeeId}</div>
      <nav className="space-y-1 text-sm">
        <Link href="/dashboard" className="block hover:underline">ダッシュボード</Link>
        <Link href="/employees" className="block hover:underline">社員</Link>
        <Link href="/annual-events" className="block hover:underline">年次イベント</Link>
        <Link href="/notifications" className="block hover:underline">通知</Link>
      </nav>
    </aside>
  );
}