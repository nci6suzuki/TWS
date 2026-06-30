// src/components/ui/navigation-progress.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function start() {
    if (finishTimerRef.current) {
      clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
    }

    setLoading(true);
    setProgress(12);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setProgress((current) => {
        if (current >= 88) return current;
        return current + Math.max(2, Math.round((90 - current) * 0.12));
      });
    }, 180);
  }

  function finish() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setProgress(100);

    finishTimerRef.current = setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 350);
  }

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");

      if (!anchor) return;

      const href = anchor.getAttribute("href");
      const targetAttr = anchor.getAttribute("target");

      if (!href) return;
      if (targetAttr === "_blank") return;
      if (href.startsWith("#")) return;
      if (href.startsWith("mailto:")) return;
      if (href.startsWith("tel:")) return;
      if (anchor.hasAttribute("download")) return;

      const url = new URL(href, window.location.href);

      if (url.origin !== window.location.origin) return;

      const currentUrl = `${window.location.pathname}${window.location.search}`;
      const nextUrl = `${url.pathname}${url.search}`;

      if (currentUrl === nextUrl) return;

      start();
    }

    window.addEventListener("click", onClick, true);

    return () => {
      window.removeEventListener("click", onClick, true);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (finishTimerRef.current) {
        clearTimeout(finishTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (loading) {
      finish();
    }
  }, [pathname, searchParams]);

  if (!loading) return null;

  return (
    <div className="pointer-events-none fixed left-0 top-0 z-[9999] h-1 w-full bg-transparent">
      <div
        className="h-full bg-indigo-600 shadow-[0_0_16px_rgba(79,70,229,0.65)] transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}