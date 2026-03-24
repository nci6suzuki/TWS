// src/app/(protected)/layout.tsx
import { ReactNode } from "react";
import { requireAuth } from "@/lib/auth/require-auth";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const me = await requireAuth(); // { userId, employeeId, role, scopes... }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        background:
          "radial-gradient(circle at 10% 10%, rgba(79, 70, 229, 0.16), transparent 28%), radial-gradient(circle at 90% 0%, rgba(14, 165, 233, 0.17), transparent 24%), linear-gradient(160deg, #eef2ff, #f8fafc 50%, #e2e8f0)",
      }}
    >
      <AppSidebar me={me} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <AppHeader me={me} />
        <main style={{ flex: 1, padding: "24px clamp(16px, 2.4vw, 28px) 32px" }}>
          <div
            style={{
              margin: "0 auto",
              width: "100%",
              maxWidth: 1040,
              display: "grid",
              gap: 18,
              alignContent: "start",
            }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}