import { SidebarV2 } from "./sidebar";
import { TopbarV2 } from "./topbar";

export function AppShellV2({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_10%,rgba(99,102,241,0.16),transparent_35%),radial-gradient(circle_at_90%_0%,rgba(14,165,233,0.12),transparent_30%),linear-gradient(180deg,#f8fafc,#f1f5f9)]">
      <TopbarV2 />
      <div className="mx-auto max-w-[1440px] px-4 lg:px-6 py-4 lg:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
          <SidebarV2 />
          <div className="space-y-6">{children}</div>
        </div>
      </div>
    </div>
  );
}