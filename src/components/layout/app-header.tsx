import { Me } from "@/types/api";

export function AppHeader({ me }: { me: Me }) {
  return (
    <header className="border-b px-4 py-3 flex items-center justify-between">
      <div className="font-semibold">Talent Management</div>
      <div className="text-sm text-gray-600">{me.role}</div>
    </header>
  );
}