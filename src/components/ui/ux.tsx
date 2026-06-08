import Link from "next/link";
import React from "react";

export function Hero({
  title,
  subtitle,
  right,
  meta,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border bg-white p-6 md:p-7 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-bold tracking-[0.18em] text-indigo-600">WORKFLOW</div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-slate-600">{subtitle}</p>}
          {meta && <div className="mt-4">{meta}</div>}
        </div>
        {right && <div className="flex flex-wrap gap-2">{right}</div>}
      </div>
    </div>
  );
}

export function KPI({
  label,
  value,
  tone = "normal",
  href,
}: {
  label: string;
  value: number | string;
  tone?: "normal" | "danger" | "ok";
  href?: string;
}) {
  const cls =
    tone === "danger"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : tone === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-slate-200 bg-slate-50 text-slate-700";

  const inner = (
    <div className={`rounded-2xl border p-4 ${cls}`}>
      <div className="text-xs font-semibold tracking-[0.12em] opacity-80">{label}</div>
      <div className="mt-2 text-3xl font-extrabold leading-none">{value}</div>
    </div>
  );

  return href ? <Link href={href} className="hover:opacity-90">{inner}</Link> : inner;
}

export function Chip({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "gray" | "danger" | "ok" | "info";
}) {
  const cls =
    tone === "danger"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : tone === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "info"
      ? "border-indigo-200 bg-indigo-50 text-indigo-700"
      : "border-slate-200 bg-slate-50 text-slate-700";

  return <span className={`inline-flex items-center rounded-xl border px-3 py-1 text-xs font-semibold ${cls}`}>{children}</span>;
}

export function PrimaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
    >
      {children}
    </Link>
  );
}

export function GhostButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center rounded-xl border bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
    >
      {children}
    </Link>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`rounded-2xl border bg-white p-4 ${className}`}>{children}</div>;
}