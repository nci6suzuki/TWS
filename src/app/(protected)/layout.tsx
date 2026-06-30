import { ReactNode } from "react";
import { requireAuth } from "@/lib/auth/require-auth";
import { AppShell } from "@/components/layout/app-shell";
import { InitialSetupGuard } from "@/components/auth/initial-setup-guard";
import { NavigationProgress } from "@/components/ui/navigation-progress";
import { ToastMessage } from "@/components/ui/toast-message";

export const runtime = "nodejs";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAuth();

  return (
    <>
      <NavigationProgress />
      <ToastMessage />
      <InitialSetupGuard>
        <AppShell>{children}</AppShell>
      </InitialSetupGuard>
    </>
  );
}