import { ReactNode } from "react";
import { requireAuth } from "@/lib/auth/require-auth";
import { AppShell } from "@/components/layout/app-shell";

export const runtime = "nodejs";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  await requireAuth();
  return <AppShell>{children}</AppShell>;
}