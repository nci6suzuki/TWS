// src/app/(protected)/layout.tsx
import { ReactNode } from "react";
import { requireAuth } from "@/lib/auth/require-auth";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const me = await requireAuth(); // { userId, employeeId, role, scopes... }

  return (
    <div className="min-h-dvh flex">
      <AppSidebar me={me} />
      <div className="flex-1 flex flex-col">
        <AppHeader me={me} />
        <main className="p-4">{children}</main>
      </div>
    </div>
  );
}