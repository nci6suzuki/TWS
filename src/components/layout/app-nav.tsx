// src/components/layout/app-nav.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonClassName } from "@/lib/ui/button-class";

type NavItem = {
  href: string;
  label: string;
  badgeKey?: "notifications";
};

const nav: NavItem[] = [
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/employees", label: "社員" },
  { href: "/employee-analytics", label: "社員分析" },
  { href: "/annual-events", label: "年間イベント" },
  { href: "/organization", label: "シナプスツリー" },
  { href: "/notifications", label: "通知", badgeKey: "notifications" },
];

export function DesktopAppNav({ unreadCount }: { unreadCount: number }) {
  const pathname = usePathname();

  return (
    <nav className="rounded-2xl border bg-white p-2 shadow-sm">
      {nav.map((item) => {
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={buttonClassName(
              [
                "group mb-1 flex min-h-11 items-center justify-between rounded-xl px-3 py-2 text-sm font-black",
                active
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
              ].join(" ")
            )}
          >
            <span className="flex items-center gap-2">
              <span
                className={[
                  "h-2 w-2 rounded-full transition",
                  active
                    ? "bg-white"
                    : "bg-slate-300 group-hover:bg-slate-500",
                ].join(" ")}
              />
              {item.label}
            </span>

            {item.badgeKey === "notifications" && unreadCount > 0 && (
              <span
                className={[
                  "rounded-full px-2 py-0.5 text-[11px] font-black",
                  active
                    ? "bg-white text-rose-600"
                    : "bg-rose-600 text-white",
                ].join(" ")}
              >
                {unreadCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileAppNav({ unreadCount }: { unreadCount: number }) {
  const pathname = usePathname();

  return (
    <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">
      {nav.map((item) => {
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={buttonClassName(
              [
                "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-black shadow-sm",
                active
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              ].join(" ")
            )}
          >
            <span>{item.label}</span>

            {item.badgeKey === "notifications" && unreadCount > 0 && (
              <span
                className={[
                  "rounded-full px-2 py-0.5 text-[11px] font-black",
                  active
                    ? "bg-white text-rose-600"
                    : "bg-rose-600 text-white",
                ].join(" ")}
              >
                {unreadCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function UnreadNotificationLink({
  unreadCount,
  compact = false,
}: {
  unreadCount: number;
  compact?: boolean;
}) {
  if (unreadCount <= 0) return null;

  if (compact) {
    return (
      <Link
        href="/notifications"
        className={buttonClassName(
          "inline-flex items-center gap-2 rounded-full bg-rose-600 px-3 py-1.5 text-xs font-black text-white shadow-sm hover:bg-rose-700"
        )}
      >
        通知 {unreadCount}
      </Link>
    );
  }

  return (
    <Link
      href="/notifications"
      className={buttonClassName(
        "mt-3 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 hover:bg-rose-100"
      )}
    >
      <span>未読通知</span>
      <span className="rounded-full bg-rose-600 px-2 py-0.5 text-white">
        {unreadCount}
      </span>
    </Link>
  );
}

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}