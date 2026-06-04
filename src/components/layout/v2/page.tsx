export function PageContainer({
  children,
  size = "xl",
}: {
  children: React.ReactNode;
  size?: "md" | "lg" | "xl";
}) {
  const max =
    size === "md" ? "max-w-[980px]" : size === "lg" ? "max-w-[1200px]" : "max-w-[1440px]";
  return <div className={`mx-auto w-full ${max} px-4 lg:px-6`}>{children}</div>;
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          {description && <p className="mt-2 text-sm text-slate-600">{description}</p>}
        </div>
        {actions ? <div className="flex gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export function PageSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        {description && <div className="text-xs text-slate-500 mt-1">{description}</div>}
      </div>
      <div className="rounded-2xl border bg-white p-4">{children}</div>
    </section>
  );
}