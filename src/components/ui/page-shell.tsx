import type { ReactNode } from "react";

export function PageShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-8 md:py-10">
        {children}
      </div>
    </main>
  );
}