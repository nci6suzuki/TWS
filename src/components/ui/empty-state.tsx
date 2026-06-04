// src/components/ui/empty-state.tsx
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
    <div className="rounded-2xl border border-dashed bg-white p-8 text-center">
      <div className="text-base font-semibold text-slate-900">{title}</div>
      {description && <div className="mt-2 text-sm text-slate-600">{description}</div>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}