// src/components/ui/clickable-row.tsx

import Link from "next/link";
import type { ReactNode } from "react";

export function ClickableRow({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={[
        "group block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm",
        "transition duration-150 ease-out",
        "hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/40 hover:shadow-md",
        "active:scale-[0.99] active:translate-y-px",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
        className,
      ].join(" ")}
    >
      {children}
    </Link>
  );
}