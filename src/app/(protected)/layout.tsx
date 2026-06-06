import { ReactNode } from "react";
import { requireAuth } from "@/lib/auth/require-auth";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  await requireAuth();
  return <div className="p-6">{children}</div>;
}