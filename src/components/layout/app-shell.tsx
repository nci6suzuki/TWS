import Link from "next/link";

const nav = [
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/employees", label: "社員" },
  { href: "/annual-events", label: "年間イベント" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1440px] px-4 lg:px-6 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <aside className="hidden lg:block">
            <div className="sticky top-5 space-y-4">
              <div className="rounded-2xl border bg-white p-4">
                <div className="text-sm font-extrabold text-slate-900">TWS</div>
                <div className="mt-1 text-xs text-slate-500">Talent / Workflow System</div>
              </div>
              <nav className="rounded-2xl border bg-white p-2">
                {nav.map((i) => (
                  <Link
                    key={i.href}
                    href={i.href}
                    className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    {i.label}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          <main className="space-y-6">{children}</main>
        </div>
      </div>
    </div>
  );
}