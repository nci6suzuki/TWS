import React from "react";

export function PageContainer({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-[1440px] px-4 lg:px-6">{children}</div>;
}

export function PageHeader({
  title,
  description,
  actions,
  meta,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-white p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
          {description && <p className="mt-2 text-sm text-slate-600">{description}</p>}
          {meta && <div className="mt-3">{meta}</div>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function Section({
  title,
  description,
  children,
  actions,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-white p-5">
      {(title || actions) && (
        <div className="flex items-end justify-between gap-3">
          <div>
            {title && <div className="text-sm font-bold text-slate-900">{title}</div>}
            {description && <div className="mt-1 text-xs text-slate-500">{description}</div>}
          </div>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      )}
      <div className={title || actions ? "mt-4" : ""}>{children}</div>
    </section>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed bg-white p-10 text-center">
      <div className="text-base font-semibold text-slate-900">{title}</div>
      {description && <div className="mt-2 text-sm text-slate-600">{description}</div>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}