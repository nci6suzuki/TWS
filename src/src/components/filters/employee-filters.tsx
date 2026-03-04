import { Me } from "@/types/api";

export function EmployeeFilters({
  me,
  initial,
}: {
  me: Me;
  initial: Record<string, string | string[] | undefined>;
}) {
  void me;
  void initial;
  return <div className="text-sm text-gray-500">フィルター機能は準備中です。</div>;
}