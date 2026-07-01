// src/components/ui/ux.tsx

import Link from "next/link";
import type { ReactNode } from "react";
import { buttonClassName } from "@/lib/ui/button-class";

type Tone = "default" | "info" | "ok" | "danger" | "gray";

function toneClass(tone: Tone = "default") {
  switch (tone) {
    case "info":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "ok":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "danger":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "gray":
      return "border-slate-200 bg-slate-100 text-slate-600";
    default:
      return "border-slate-200 bg-white text-slate-700";
  }
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        "rounded-3xl border border-slate-200 bg-white shadow-sm",
        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}

export function Chip({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold",
        toneClass(tone),
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export function PrimaryButton({
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
      className={buttonClassName(
        [
          "inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-bold text-white shadow-sm hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md",
          className,
        ].join(" ")
      )}
    >
      {children}
    </Link>
  );
}

export function GhostButton({
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
      className={buttonClassName(
        [
          "inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md",
          className,
        ].join(" ")
      )}
    >
      {children}
    </Link>
  );
}

export function KPI({
  label,
  value,
  tone = "default",
  href,
}: {
  label: string;
  value: number | string;
  tone?: Tone;
  href?: string;
}) {
  const inner = (
    <div
      className={[
        "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm",
        "transition duration-150 ease-out",
        href
          ? "hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] active:translate-y-px"
          : "",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-slate-500">{label}</p>
        <span
          className={[
            "h-3 w-3 rounded-full",
            tone === "danger"
              ? "bg-rose-500"
              : tone === "ok"
                ? "bg-emerald-500"
                : tone === "info"
                  ? "bg-blue-500"
                  : "bg-slate-400",
          ].join(" ")}
        />
      </div>

      <p
        className={[
          "mt-3 text-4xl font-black tracking-tight",
          tone === "danger"
            ? "text-rose-600"
            : tone === "ok"
              ? "text-emerald-600"
              : "text-slate-900",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );

  if (!href) return inner;

  return (
    <Link
      href={href}
      className="block rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
    >
      {inner}
    </Link>
  );
}

export function Hero({
  title,
  subtitle,
  meta,
  right,
}: {
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-slate-100 blur-3xl" />
      <div className="absolute bottom-0 left-20 h-32 w-32 rounded-full bg-blue-50 blur-3xl" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-400">
            Workflow
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-600">
              {subtitle}
            </p>
          )}

          {meta && <div className="mt-5">{meta}</div>}
        </div>

        {right && <div className="flex flex-wrap items-center gap-3">{right}</div>}
      </div>
    </section>
  );
}