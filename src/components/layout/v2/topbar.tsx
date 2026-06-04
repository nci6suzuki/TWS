"use client";

export function TopbarV2() {
  return (
    <header className="sticky top-0 z-20 border-b bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/40">
      <div className="mx-auto max-w-[1440px] px-4 lg:px-6 h-14 flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">Talent Workspace</div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-xs text-slate-500 w-[340px]">
            ⌘K で検索（後でCommand Palette入れます）
          </div>
          <button className="h-9 w-9 rounded-xl border bg-white text-sm">🔔</button>
          <button className="h-9 w-9 rounded-xl border bg-white text-sm">👤</button>
        </div>
      </div>
    </header>
  );
}