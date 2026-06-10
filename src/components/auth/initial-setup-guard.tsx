"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function InitialSetupGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function checkSetup() {
      if (
        pathname === "/welcome/setup-profile" ||
        pathname === "/login" ||
        pathname === "/unauthorized"
      ) {
        return;
      }

      const res = await fetch("/api/me/setup-status", {
        method: "GET",
        cache: "no-store",
      });

      const json = await res.json();

      if (cancelled) return;

      if (res.ok && json?.data?.needsSetup) {
        router.replace("/welcome/setup-profile");
      }
    }

    checkSetup();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return <>{children}</>;
}