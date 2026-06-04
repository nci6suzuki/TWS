// src/app/(protected)/layout.tsx
import { ReactNode } from "react";
import { requireAuth } from "@/lib/auth/require-auth";
import { AppShellV2 } from "@/components/layout/v2/app-shell";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  await requireAuth(); // 認証だけ通せばOK（meが必要なら後でTopbarに渡す）

  return <AppShellV2>{children}</AppShellV2>;
}